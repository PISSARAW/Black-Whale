#!/bin/sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 BACKUP.sql.gz [ENV_FILE]" >&2
  exit 1
fi

backup_file="$1"
project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${2:-$project_dir/.env.production}"

test -f "$backup_file" || { echo "Backup not found: $backup_file" >&2; exit 1; }
set -a
. "$env_file"
set +a

echo "This replaces all data in database '$POSTGRES_DB'. Type the database name to continue:"
read -r confirmation
[ "$confirmation" = "$POSTGRES_DB" ] || { echo "Restore cancelled."; exit 1; }

docker compose --env-file "$env_file" -f "$compose_file" stop web admin backup
docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
  dropdb --username "$POSTGRES_USER" --if-exists "$POSTGRES_DB"
docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
  createdb --username "$POSTGRES_USER" "$POSTGRES_DB"
gzip -dc "$backup_file" | docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=on
docker compose --env-file "$env_file" -f "$compose_file" up -d
echo "Restore completed."
