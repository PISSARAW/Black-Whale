# Production deployment on Hetzner

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

The deployment validates the configuration, builds immutable images, runs `prisma migrate deploy` and the data backfills, waits for application healthchecks, and then exposes the stack through Caddy. Caddy obtains and renews TLS certificates automatically.

The migration step runs on its own, before any running container is replaced. If it fails the script stops there and the previous release keeps serving — nothing is torn down, and the failure costs no downtime. Fix what the output reports and run the script again.

For upgrades, pull the reviewed commit and run the same command. Check state with:

```sh
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml ps
docker compose --env-file .env.production -f infrastructure/docker/docker-compose.prod.yml logs --tail=200
```

## 4. Backups and restoration

The `backup` service creates a compressed PostgreSQL dump every 24 hours and keeps 14 days by default. Docker volumes are local to the server, so copy backups off-server or enable Hetzner server backups as a second layer.

Create an immediate host-side backup:

```sh
./infrastructure/hetzner/backup-now.sh
```

Restore a dump (this replaces the current database and requires typing the database name):

```sh
./infrastructure/hetzner/restore.sh /path/to/backup.sql.gz
```

Test restoration periodically on a non-production server.

## 5. Existing development databases

`packages/database/prisma/migrations` is the only migration history. It is a squashed baseline generated from the canonical Prisma schema, intended for a first production installation. Do not point the production Compose file at an old development database without taking a dump and planning a one-time migration.
