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

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

chmod 600 "$env_file"
compose config --quiet
compose build --pull

# The schema and the backfills run here, on their own, before anything that is
# currently serving is touched. Inside `up` they are a gate: compose stops web
# and admin to recreate them, then waits for the migration to complete, and a
# backfill that fails leaves that gate shut for as long as the fix takes — the
# site answers 502 in the meantime. Failing here costs nothing: the previous
# containers are still up and still serving the previous release.
if ! compose run --rm migrate; then
  echo "Migration or backfill failed. The running stack was left untouched." >&2
  echo "Read the output above, fix it, and run this script again." >&2
  exit 1
fi

compose up -d --remove-orphans
compose ps
