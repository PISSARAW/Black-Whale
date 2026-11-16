"""Provision tour inference credentials without printing them to a terminal.

gateway emits credentials on stdout ONLY for a pipe to the web command.
Existing production configuration is backed up before atomic replacement.
"""
import json
import os
from pathlib import Path
import secrets
import shutil
import sys
import tempfile
import time


def atomic_private(path, content):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.tour-ai-')
    try:
        with os.fdopen(fd, 'w') as output:
            output.write(content)
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if sys.argv[1] == 'gateway':
    path = Path('/etc/black-whale-tour-ai.env')
    if path.exists():
        values = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)
        token = values['AI_TOKEN']
    else:
        token = secrets.token_hex(32)
        atomic_private(path, 'AI_TOKEN=' + token + '\nAI_MODEL=qwen2.5:1.5b\n')
    print(json.dumps({'token': token}))
elif sys.argv[1] == 'web':
    token = json.load(sys.stdin)['token']
    if len(token) != 64 or any(c not in '0123456789abcdef' for c in token):
        raise ValueError('Invalid service credential')
    path = Path('/opt/black-whale/.env.production')
    backup = Path('/opt/black-whale-tour-ai/deploy-backup')
    backup.mkdir(mode=0o700, parents=True, exist_ok=True)
    shutil.copy2(path, backup / ('.env.production.before-tour-ai-' + str(time.time_ns())))
    values = {'OLLAMA_URL': 'https://vps-e177d34a.tail503760.ts.net:9445',
              'OLLAMA_MODEL': 'qwen2.5:1.5b', 'OLLAMA_TOKEN': token, 'OLLAMA_TIMEOUT_MS': '25000'}
    lines = [line for line in path.read_text().splitlines() if line.split('=', 1)[0] not in values]
    atomic_private(path, '\n'.join(lines + [key + '=' + value for key, value in values.items()]) + '\n')
    print('Tour inference configured; previous configuration backed up.')
else:
    raise ValueError('Expected gateway or web')
