#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${1:-$project_dir/.env.production}"
destination="${2:-$project_dir/black-whale-manual-$(date -u +%Y%m%dT%H%M%SZ).sql.gz}"

set -a
. "$env_file"
set +a

docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --no-owner --no-acl | gzip -9 > "$destination"
chmod 600 "$destination"
echo "Backup created: $destination"
