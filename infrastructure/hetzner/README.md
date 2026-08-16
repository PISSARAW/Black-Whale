---
titre: hetzner
etage: 2
couvre:
  - infrastructure/hetzner/**
depend-de: [12-l-exploitation]
revu-le: 2026-08-05
empreinte: 06cafe7
decisions: [adr-006]
---

# `infrastructure/hetzner` — déploiement production

**Promet :** provisionner et maintenir le serveur de production sur Hetzner avec Docker, backups et rollback.
**Refuse :** de contenir du code applicatif ou des secrets committés.
**Entrées publiques :** `infrastructure/hetzner/deploy.sh`, `infrastructure/hetzner/rollback.sh`, `infrastructure/hetzner/backup-now.sh`, `infrastructure/hetzner/verify-restore.sh`.
**Carte :** [12 l'exploitation](../../docs/carte/12-l-exploitation.md)

This deployment targets a Debian 12 or Ubuntu 24.04 Hetzner Cloud server with Docker Engine and the Compose plugin. Only SSH, HTTP, and HTTPS need to be reachable from the internet.

## 1. Server and DNS

Create a server with at least 2 vCPU, 4 GB RAM, and 40 GB disk. Attach an SSH key and enable Hetzner backups or snapshots. In the Hetzner Cloud Firewall, allow inbound TCP 22 from trusted administrator IPs, TCP 80 and TCP/UDP 443 from anywhere. Do not expose ports 3000-3002, 5432, or 6379.

Point these DNS records to the server before starting Caddy:

- `example.com`
- `admin.example.com`

Install Docker Engine and its Compose plugin from Docker's official Debian/Ubuntu repository. Add the deployment user to the `docker` group, clone the repository, and keep the checkout under a dedicated directory such as `/opt/black-whale`.

## 2. Secrets

```sh
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -base64 48
```

Generate a different random value for every secret. Use `openssl rand -hex 32` for the PostgreSQL password so it remains safe inside the connection URL; base64 is suitable for the session secret. Set `DOMAIN` and `ACME_EMAIL`. Never commit `.env.production`.

## 3. First deployment and upgrades

```sh
./infrastructure/hetzner/deploy.sh
```

The deployment refuses to run on a dirty checkout (the image tag would not describe its contents), validates the configuration, builds images tagged with the commit, runs `prisma migrate deploy` and the data backfills, waits for application healthchecks, and then exposes the stack through Caddy. Caddy obtains and renews TLS certificates automatically.

The migration step runs on its own, before any running container is replaced. If it fails the script stops there and the previous release keeps serving — nothing is torn down, and the failure costs no downtime. Fix what the output reports and run the script again.

The deploy host is kept within a fixed disk budget: build cache and dangling
images are removed before and after builds, while the three most recent
successful releases remain available for rollback. Set
`BLACK_WHALE_RETAIN_RELEASES` to a positive integer to retain a different
number. The release being deployed and any image still used by a running
container are never removed.

For upgrades, pull the reviewed commit and run the same command. Check state with:

```sh
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml ps
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs --tail=200
```

## 4. Rolling back

Every image is tagged with the commit it was built from, and `deploy.sh` appends that tag to `.deploy-history` once the stack is up. Going back is therefore a re-`up`, not a rebuild:

```sh
./infrastructure/hetzner/rollback.sh --list   # tags, dates, and which images are still on disk
./infrastructure/hetzner/rollback.sh          # the release before the current one
./infrastructure/hetzner/rollback.sh a1b2c3d4 # a named release
```

The script refuses before stopping anything if the target images have been pruned, so a rollback either happens or leaves the current release running.

The **database schema is not reversed**. Prisma migrations here are forward-only, so an older image is expected to tolerate a newer schema. If it does not, the way out is a forward deploy. The deploy script keeps the most recent releases according to the retention setting above and removes older local image tags.

## 5. Backups and restoration

Every 24 hours the `backup` service writes **two** dumps and keeps 14 days of each.

- **The full dump** (`<db>_<timestamp>.sql.gz`) — the whole database, kept on the server's own volume. It is the fast way back from a mistake, and it is worth nothing if the server itself is lost.
- **The state dump** (`<db>_state_<timestamp>.sql.gz`) — only the tables git cannot rebuild: `WorldBranch`, `WorldEventRecord`, `WorldProjectionSnapshot`, `WorldEffectRecord`, and the `NarrativeEvent` / `Presence` rows entered through the back-office. Everything else in the database is derived — `data/` is the canon and the compiler replays it on each deployment — so this small file is the only irreplaceable thing the server holds. It is data-only, its inserts name their columns, and it is `ON CONFLICT DO NOTHING`, because it is meant to be laid back _on top_ of a database the migrations and the compiler have already rebuilt.

Create an immediate host-side backup:

```sh
./infrastructure/hetzner/backup-now.sh
```

Restore a full dump (this replaces the current database and requires typing the database name):

```sh
./infrastructure/hetzner/restore.sh /path/to/backup.sql.gz
```

### Sending the state dump off the server

Unset by default; the backup behaves exactly as before until these are filled in. Generate the key pair **on your own machine** and give the server only the public half — a server that can decrypt its own off-site backups has not really put them anywhere else:

```sh
age-keygen -o black-whale-backup.key     # keep this file off the server, in a password manager
# public key: age1...
ssh-keygen -t ed25519 -f backup_storagebox -C black-whale-backup
ssh-copy-id -p 23 -i backup_storagebox.pub uXXXXXX@uXXXXXX.your-storagebox.de
ssh-keyscan -p 23 uXXXXXX.your-storagebox.de > /opt/black-whale/secrets/backup_known_hosts
```

Then in `.env.production`:

```sh
BACKUP_REMOTE_TARGET=uXXXXXX@uXXXXXX.your-storagebox.de:black-whale/
BACKUP_REMOTE_PORT=23
BACKUP_AGE_RECIPIENT=age1...                       # the public key, never the private one
BACKUP_SSH_KEY_FILE=/opt/black-whale/secrets/backup_storagebox
BACKUP_KNOWN_HOSTS_FILE=/opt/black-whale/secrets/backup_known_hosts
```

The dump is encrypted with `age` **before** it leaves the host, so the Storage Box holds ciphertext it cannot read. A target set without a recipient key is refused rather than sent in clear. A failed upload is reported and does not fail the run: the local copy is already on disk. To read one back:

```sh
age --decrypt --identity black-whale-backup.key --output state.sql.gz <db>_state_<timestamp>.sql.gz.age
```

### Proving the backups restore — weekly

A backup nobody has restored is not a backup. Run the drill weekly; it works on a copy and never touches the live database:

```sh
./infrastructure/hetzner/verify-restore.sh
```

It restores the newest full dump into a scratch database beside the real one, replays the newest state dump over it **twice** (it has to be idempotent), counts what must not be empty, and drops the scratch database. Add it to the deployment user's crontab:

```cron
23 5 * * 1 cd /opt/black-whale && ./infrastructure/hetzner/verify-restore.sh >> /var/log/black-whale-restore-drill.log 2>&1
```

The `Restore drill` GitHub workflow runs the same scripts every Monday against a database built from the migrations, including the case that actually matters — canon rebuilt, visitor state gone, state dump replayed on top. That is what keeps these scripts from rotting between disasters.

### If the server is lost entirely

1. Provision a new server and follow §1–§3. The migrations rebuild the schema and the compiler rebuilds the canon from `data/`, which lives in git.
2. Fetch the newest `*_state_*.sql.gz.age` from the Storage Box and decrypt it with the key you kept off the server.
3. Replay it over the fresh database:
   ```sh
   gzip -dc state.sql.gz | docker compose --env-file .env.production \
     -f infrastructure/docker/docker-compose.prod.yml exec -T postgres \
     psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=on
   ```
4. Run `./infrastructure/hetzner/verify-restore.sh` and check the branch counts against what the last drill reported.

## 6. Existing development databases

`packages/database/prisma/migrations` is the only migration history. It is a squashed baseline generated from the canonical Prisma schema, intended for a first production installation. Do not point the production Compose file at an old development database without taking a dump and planning a one-time migration.
