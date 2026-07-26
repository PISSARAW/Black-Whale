#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${1:-$project_dir/.env.production}"

if [ ! -f "$env_file" ]; then
  echo "Missing production environment file: $env_file" >&2
  echo "Copy .env.production.example and replace every placeholder." >&2
  exit 1
fi

if grep -q 'replace-with-' "$env_file"; then
  echo "Refusing to deploy with placeholder secrets in $env_file" >&2
  exit 1
fi

chmod 600 "$env_file"
docker compose --env-file "$env_file" -f "$compose_file" config --quiet
docker compose --env-file "$env_file" -f "$compose_file" build --pull
docker compose --env-file "$env_file" -f "$compose_file" up -d --remove-orphans
docker compose --env-file "$env_file" -f "$compose_file" ps
