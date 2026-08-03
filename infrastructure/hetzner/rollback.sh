#!/bin/sh
set -eu

# Put the previously deployed images back, without building anything.
#
# The point is that this is fast and offline: it re-runs `up` against images
# that already exist on the host. A rollback that has to rebuild is a second
# deploy, and it happens at the worst possible moment. Pass a tag to go back to
# a specific release instead of the one before the current one.
#
#   infrastructure/hetzner/rollback.sh            # the release before this one
#   infrastructure/hetzner/rollback.sh a1b2c3d4   # a named release
#   infrastructure/hetzner/rollback.sh --list     # what is available

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
history_file="$project_dir/.deploy-history"
env_file="$project_dir/.env.production"

if [ ! -f "$history_file" ]; then
  echo "No deploy history at $history_file: nothing to roll back to." >&2
  echo "It is written by deploy.sh, so the first rollback is possible only" >&2
  echo "after the second deploy." >&2
  exit 1
fi

if [ "${1:-}" = "--list" ]; then
  echo "tag          deployed at            images present"
  # Oldest first, as recorded. An entry whose images have been pruned is shown
  # rather than hidden: knowing a release is gone is the point of the listing.
  while read -r tag deployed_at; do
    if docker image inspect "black-whale/web:$tag" >/dev/null 2>&1; then
      present=yes
    else
      present=no
    fi
    printf '%-12s %-22s %s\n' "$tag" "$deployed_at" "$present"
  done <"$history_file"
  exit 0
fi

current="$(tail -n 1 "$history_file" | cut -d' ' -f1)"

if [ -n "${1:-}" ]; then
  target="$1"
else
  target="$(tail -n 2 "$history_file" | head -n 1 | cut -d' ' -f1)"
  if [ "$target" = "$current" ]; then
    echo "Only one release has ever been deployed ($current): nothing to go back to." >&2
    exit 1
  fi
fi

if [ "$target" = "$current" ]; then
  echo "$target is already the running release." >&2
  exit 1
fi

# Checked before anything is stopped: rolling back onto an image that was
# pruned would take the site down and leave it down.
for service in web admin migrate; do
  if ! docker image inspect "black-whale/$service:$target" >/dev/null 2>&1; then
    echo "Image black-whale/$service:$target is not on this host." >&2
    echo "Run '$0 --list' to see what is still available." >&2
    exit 1
  fi
done

if [ ! -f "$env_file" ]; then
  echo "Missing $env_file." >&2
  exit 1
fi

compose() {
  IMAGE_TAG="$target" docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

echo "Rolling back from $current to $target"

# Deliberately not re-run: a rollback moves the code back, and the schema does
# not go with it. Prisma migrations are forward-only here, so an older image is
# expected to tolerate a newer schema; if it does not, the fix is a forward
# deploy, not an automatic down-migration this script would have to guess at.
echo "Note: the database schema is left as it is. Migrations are not reversed."

compose up -d --no-build --remove-orphans
compose ps

printf '%s %s\n' "$target" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >>"$history_file"
echo "Rolled back to $target."
