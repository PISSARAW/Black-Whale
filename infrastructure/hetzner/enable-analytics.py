#!/usr/bin/env python3
"""Initialize the optional private Umami service without printing credentials.

Run from a clean release checkout on the production server. Idempotent: the
same website and administrator are retained when the command is run again.
"""
import os
from pathlib import Path
import re
import secrets
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]


def configure(path: Path):
    lines = path.read_text().splitlines()
    values = {}
    for line in lines:
        if re.match(r'^[A-Z][A-Z0-9_]*=', line):
            key, value = line.split('=', 1)
            values[key] = value.strip().strip('\"\'')
    profiles = set(filter(None, values.get('COMPOSE_PROFILES', '').split(',')))
    profiles.add('analytics')
    updates = {'COMPOSE_PROFILES': ','.join(sorted(profiles))}
    for key in ('UMAMI_DB_PASSWORD', 'UMAMI_APP_SECRET', 'UMAMI_TWO_FACTOR_KEY', 'UMAMI_PASSWORD'):
        updates[key] = values.get(key) or secrets.token_hex(32)
    updates['UMAMI_WEBSITE_ID'] = values.get('UMAMI_WEBSITE_ID') or str(uuid.uuid4())
    updates['UMAMI_USERNAME'] = values.get('UMAMI_USERNAME') or 'black-whale'
    for key, value in updates.items():
        lines = [line for line in lines if not line.startswith(f'{key}=')]
        lines.append(f'{key}={value}')
    temporary = path.with_suffix('.analytics.tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write('\n'.join(lines) + '\n')
    os.replace(temporary, path)
    return {**values, **updates}


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    path = Path(os.environ.get('BLACK_WHALE_ENV_FILE', ROOT / '.env.production'))
    values = configure(path)
    compose = ['docker', 'compose', '--env-file', str(path), '-f',
               str(ROOT / 'infrastructure/docker/docker-compose.prod.yml')]
    subprocess.run(compose + ['config', '--quiet'], check=True)
    subprocess.run(compose + ['up', '-d', 'umami-db', 'umami'], check=True)
    for _ in range(180):
        check = subprocess.run(compose + ['exec', '-T', 'umami', 'node', '-e',
            "fetch('http://127.0.0.1:3000/api/heartbeat').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if check.returncode == 0:
            break
        time.sleep(1)
    else:
        raise SystemExit('Umami did not become healthy. The public application was not changed.')
    # The seeded account is never exposed: no UI or read API is public. Rotate
    # its default password before the admin app is configured to use the API.
    username = sql_string(values['UMAMI_USERNAME'])
    password = sql_string(values['UMAMI_PASSWORD'])
    website = sql_string(str(uuid.UUID(values['UMAMI_WEBSITE_ID'])))
    domain = sql_string(values['DOMAIN'])
    statement = f"""
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    UPDATE \"user\" SET username={username}, password=crypt({password}, gen_salt('bf', 10))
      WHERE user_id='41e2b680-648e-4b09-bcd7-3e2b10c06264';
    INSERT INTO website (website_id, name, domain, user_id, created_by)
      VALUES ({website}, 'Black Whale', {domain},
        '41e2b680-648e-4b09-bcd7-3e2b10c06264', '41e2b680-648e-4b09-bcd7-3e2b10c06264')
      ON CONFLICT (website_id) DO UPDATE SET domain=EXCLUDED.domain;
    COMMIT;
    """
    result = subprocess.run(compose + ['exec', '-T', 'umami-db', 'psql', '-U', 'umami', '-d', 'umami',
                             '-v', 'ON_ERROR_STOP=1'], input=statement, text=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if result.returncode:
        raise SystemExit('Umami account initialization failed. SQL diagnostics were withheld to protect credentials.')
    subprocess.run(compose + ['up', '-d', 'umami-backup'], check=True)
    print('Umami initialized. Statistics are private; credentials remain in the production environment.')


if __name__ == '__main__':
    main()
