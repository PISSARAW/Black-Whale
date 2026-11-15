"""Bounded native Ollama endpoint for the tour, behind Tailscale Serve.

Only tour classification and site search schemas are accepted. No prompts or answers are logged.
The existing fleet resource policy and Ollama cgroup remain authoritative.
"""
import hmac
import json
import os
import sys
import threading
import time
import uuid
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.environ.get('AI_RUNTIME_PATH', '/opt/tailscale-personnel/ai-router'))
import node_runtime  # noqa: E402

MODEL = os.environ.get('AI_MODEL', 'qwen2.5:1.5b')
TOKEN = os.environ['AI_TOKEN']
BUSY = threading.Lock()
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))
TOPICS = {'who', 'allegiance', 'since', 'route', 'nen', 'techniques', 'none'}
SEARCH_KINDS = ['all', 'character', 'ability', 'event', 'place', 'faction', 'page']
SEARCH_CATEGORIES = ['none', 'enhancer', 'transmuter', 'emitter', 'conjurer', 'manipulator', 'specialist']
SEARCH_SCHEMA = {
    'type': 'object',
    'properties': {
        'kind': {'type': 'string', 'enum': SEARCH_KINDS},
        'category': {'type': 'string', 'enum': SEARCH_CATEGORIES},
        'terms': {'type': 'array', 'maxItems': 4, 'items': {'type': 'string', 'maxLength': 60}},
    },
    'required': ['kind', 'category', 'terms'],
    'additionalProperties': False,
}


def checked_search(value):
    if not isinstance(value, dict) or set(value) != {'kind', 'category', 'terms'}:
        raise ValueError('Invalid search intent')
    if value['kind'] not in SEARCH_KINDS or value['category'] not in SEARCH_CATEGORIES:
        raise ValueError('Unknown search filter')
    terms = value['terms']
    if not isinstance(terms, list) or len(terms) > 4:
        raise ValueError('Invalid search terms')
    if any(not isinstance(term, str) or len(term) > 60 for term in terms):
        raise ValueError('Invalid search term')


def validate(data):
    if not isinstance(data, dict) or data.get('model') != MODEL or data.get('stream') is not False:
        raise ValueError('Unsupported request')
    messages = data.get('messages')
    if not isinstance(messages, list) or len(messages) != 2:
        raise ValueError('Two messages required')
    for message, role, limit in zip(messages, ('system', 'user'), (16000, 160)):
        if not isinstance(message, dict) or message.get('role') != role:
            raise ValueError('Invalid role')
        content = message.get('content')
        if not isinstance(content, str) or not 1 <= len(content) <= limit:
            raise ValueError('Invalid content')
    schema = data.get('format')
    if not isinstance(schema, dict) or schema.get('type') != 'object':
        raise ValueError('Object schema required')
    props = schema.get('properties', {})
    if not isinstance(props, dict) or len(props) != 1:
        raise ValueError('Unsupported schema')
    kind = next(iter(props))
    if schema.get('required') != [kind] or not isinstance(props[kind], dict):
        raise ValueError('Required classification field')
    if kind == 'topic':
        field = props[kind]
        if field.get('type') != 'string' or set(field.get('enum', [])) != TOPICS:
            raise ValueError('Unsupported topics')
    elif kind == 'keywords':
        field = props[kind]
        items = field.get('items', {})
        words = items.get('enum', [])
        if field.get('type') != 'array' or field.get('maxItems') != 5:
            raise ValueError('Unsupported keywords')
        if items.get('type') != 'string' or not isinstance(words, list) or not 1 <= len(words) <= 2000:
            raise ValueError('Invalid vocabulary')
        if any(not isinstance(w, str) or not 1 <= len(w) <= 80 for w in words):
            raise ValueError('Invalid vocabulary word')
    elif kind == 'search':
        if props[kind] != SEARCH_SCHEMA:
            raise ValueError('Unsupported search schema')
    else:
        raise ValueError('Unsupported classification')
    return kind


def infer(data):
    node = node_runtime.snapshot('vps-e177d34a')
    model = next((m for m in node['models'] if m['provider'] == 'ollama' and m['id'] == MODEL), None)
    if model is None or node_runtime.exclusion(node, model, data['messages']):
        return None
    payload = {
        'model': MODEL, 'messages': data['messages'], 'format': data['format'],
        'stream': False, 'keep_alive': '5m',
        'options': {'temperature': 0, 'num_predict': 64, 'num_ctx': 4096, 'num_thread': 2},
    }
    request = urllib.request.Request('http://127.0.0.1:11434/api/chat',
                                     data=json.dumps(payload).encode(),
                                     headers={'Content-Type': 'application/json'})
    with HTTP.open(request, timeout=23) as response:
        return json.load(response)


def checked_content(result, data, kind):
    if not result or result.get('done_reason') != 'stop':
        raise ValueError('Incomplete inference')
    content = json.loads(result['message']['content'])
    if not isinstance(content, dict) or set(content) != {kind}:
        raise ValueError('Invalid classification')
    if kind == 'topic':
        if content[kind] not in TOPICS:
            raise ValueError('Unknown topic')
    elif kind == 'search':
        checked_search(content[kind])
    else:
        words = content[kind]
        allowed = data['format']['properties']['keywords']['items']['enum']
        if not isinstance(words, list) or len(words) > 5 or any(w not in allowed for w in words):
            raise ValueError('Unknown keyword')
    return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def reply(self, status, payload, inference_id=''):
        raw = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Connection', 'close')
        if inference_id:
            self.send_header('X-Inference-Id', inference_id)
        self.end_headers()
        self.wfile.write(raw)
        self.close_connection = True

    def do_POST(self):
        if not hmac.compare_digest(self.headers.get('Authorization', '').encode(), ('Bearer ' + TOKEN).encode()):
            return self.reply(401, {'error': 'Unauthorized'})
        if self.path != '/api/chat':
            return self.reply(404, {'error': 'Not found'})
        acquired = False
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if self.headers.get_content_type() != 'application/json' or not 0 < length <= 32768:
                return self.reply(400, {'error': 'Invalid body'})
            self.connection.settimeout(5)
            data = json.loads(self.rfile.read(length))
            kind = validate(data)
            acquired = BUSY.acquire(blocking=False)
            if not acquired:
                return self.reply(429, {'error': 'Busy'})
            started = time.monotonic()
            result = infer(data)
            if result is None:
                return self.reply(503, {'error': 'Resources unavailable'})
            checked_content(result, data, kind)
            inference_id = uuid.uuid4().hex
            self.reply(200, result, inference_id)
            print(json.dumps({'event': 'inference', 'id': inference_id, 'kind': kind,
                              'model': MODEL, 'elapsed_ms': round((time.monotonic()-started)*1000),
                              'eval_count': result.get('eval_count')}), flush=True)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except (ValueError, TypeError, KeyError):
            self.reply(400, {'error': 'Invalid classification'})
        except (OSError, urllib.error.URLError):
            self.reply(503, {'error': 'Inference unavailable'})
        finally:
            if acquired:
                BUSY.release()


class Server(ThreadingHTTPServer):
    daemon_threads = True
    slots = threading.BoundedSemaphore(8)

    def process_request(self, request, address):
        if not self.slots.acquire(False):
            request.close()
            return
        try:
            super().process_request(request, address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            self.slots.release()


if __name__ == '__main__':
    Server(('127.0.0.1', 8768), Handler).serve_forever()
