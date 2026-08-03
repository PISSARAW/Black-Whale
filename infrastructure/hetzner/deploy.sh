#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${1:-$project_dir/.env.production}"
# One line per successful deploy, oldest first: the tag and when it went live.
# rollback.sh reads it backwards. It lives outside the repo tree's tracked
# files because it describes this host, not the code.
history_file="$project_dir/.deploy-history"

if [ ! -f "$env_file" ]; then
  echo "Missing production environment file: $env_file" >&2
  echo "Copy .env.production.example and replace every placeholder." >&2
  exit 1
fi

if grep -q 'replace-with-' "$env_file"; then
  echo "Refusing to deploy with placeholder secrets in $env_file" >&2
  exit 1
fi

# The images are named after the commit they were built from. Without it every
# build overwrote the same untagged image, so the previous release stopped
# existing the moment the new one was built — the only way back was a checkout
# and a rebuild, which is not a rollback, it is a second deploy under pressure.
if ! IMAGE_TAG="$(git -C "$project_dir" rev-parse --short=12 HEAD 2>/dev/null)"; then
  echo "Not a git checkout: cannot tag the images with the commit they contain." >&2
  exit 1
fi
if [ -n "$(git -C "$project_dir" status --porcelain 2>/dev/null)" ]; then
  echo "Refusing to deploy: the checkout has uncommitted changes, so the tag" >&2
  echo "$IMAGE_TAG would not describe what is in the image." >&2
  exit 1
fi
export IMAGE_TAG

compose() {
  IMAGE_TAG="$IMAGE_TAG" docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

echo "Deploying $IMAGE_TAG"
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

# Recorded only once the stack is actually up, so a failed deploy never becomes
# a rollback target.
printf '%s %s\n' "$IMAGE_TAG" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >>"$history_file"
echo "Deployed $IMAGE_TAG. To undo: infrastructure/hetzner/rollback.sh"
