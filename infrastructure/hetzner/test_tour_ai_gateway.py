"""HTTP contract tests; no fleet access or model loading."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import threading
import types
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch

os.environ['AI_TOKEN'] = 'test-only-token'
sys.modules['node_runtime'] = types.ModuleType('node_runtime')
spec = importlib.util.spec_from_file_location('gateway', Path(__file__).with_name('tour-ai-gateway.py'))
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)


def question():
    return {'model': gateway.MODEL, 'stream': False,
            'messages': [{'role': 'system', 'content': 'Classify'}, {'role': 'user', 'content': 'Orders?'}],
            'format': {'type': 'object', 'properties': {'topic': {'type': 'string', 'enum': sorted(gateway.TOPICS)}}, 'required': ['topic']}}


class GatewayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = gateway.Server(('127.0.0.1', 0), gateway.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def post(self, data, token='test-only-token'):
        request = urllib.request.Request(f'http://127.0.0.1:{self.server.server_port}/api/chat',
                                         data=json.dumps(data).encode(),
                                         headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
        try:
            return urllib.request.urlopen(request, timeout=3)
        except urllib.error.HTTPError as error:
            return error

    def test_requires_service_identity(self):
        with patch.object(gateway, 'infer') as infer:
            self.assertEqual(self.post(question(), 'wrong').status, 401)
            infer.assert_not_called()

    def test_rejects_arbitrary_chat_before_inference(self):
        data = question()
        data['format'] = {'type': 'object', 'properties': {'answer': {'type': 'string'}}}
        with patch.object(gateway, 'infer') as infer:
            self.assertEqual(self.post(data).status, 400)
            infer.assert_not_called()

    def test_validated_native_reply_has_traceable_inference_id(self):
        result = {'message': {'content': '{"topic":"allegiance"}'}, 'done_reason': 'stop', 'eval_count': 9}
        with patch.object(gateway, 'infer', return_value=result):
            response = self.post(question())
            self.assertEqual(response.status, 200)
            self.assertTrue(response.headers['X-Inference-Id'])
            self.assertEqual(json.load(response), result)

    def test_invalid_or_truncated_output_never_reaches_site(self):
        for content, reason in [('{"topic":"spoiler"}', 'stop'), ('{"topic":"who"}', 'length')]:
            with patch.object(gateway, 'infer', return_value={'message': {'content': content}, 'done_reason': reason}):
                self.assertEqual(self.post(question()).status, 400)

    def test_resource_pressure_and_busy_model_fail_fast(self):
        with patch.object(gateway, 'infer', return_value=None):
            self.assertEqual(self.post(question()).status, 503)
        gateway.BUSY.acquire()
        try:
            with patch.object(gateway, 'infer') as infer:
                self.assertEqual(self.post(question()).status, 429)
                infer.assert_not_called()
        finally:
            gateway.BUSY.release()

    def test_search_schema_is_explicitly_allowed_and_validated(self):
        data = question()
        data['format'] = {'type': 'object', 'properties': {'search': gateway.SEARCH_SCHEMA}, 'required': ['search']}
        content = {'search': {'kind': 'ability', 'category': 'manipulator', 'terms': []}}
        result = {'message': {'content': json.dumps(content)}, 'done_reason': 'stop'}
        with patch.object(gateway, 'infer', return_value=result):
            self.assertEqual(self.post(data).status, 200)
        content['search']['terms'] = ['word'] * 5
        result['message']['content'] = json.dumps(content)
        with patch.object(gateway, 'infer', return_value=result):
            self.assertEqual(self.post(data).status, 400)

    def test_search_cannot_request_free_prose_or_arbitrary_fields(self):
        data = question()
        data['format'] = {'type': 'object', 'properties': {'search': {'type': 'string'}}, 'required': ['search']}
        with patch.object(gateway, 'infer') as infer:
            self.assertEqual(self.post(data).status, 400)
            infer.assert_not_called()


if __name__ == '__main__':
    unittest.main()
