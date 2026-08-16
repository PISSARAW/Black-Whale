#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${1:-$project_dir/.env.production}"
# One line per successful deploy, oldest first: the tag and when it went live.
# rollback.sh reads it backwards. It lives outside the repo tree's tracked
# files because it describes this host, not the code.
history_file="$project_dir/.deploy-history"
# Keep the live release and two known-good rollback targets. Override this on a
# larger host when retaining more local releases is worth the disk space.
retain_releases="${BLACK_WHALE_RETAIN_RELEASES:-3}"

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

case "$retain_releases" in
  ''|*[!0-9]*|0)
    echo "BLACK_WHALE_RETAIN_RELEASES must be a positive integer." >&2
    exit 1
    ;;
esac

compose() {
  IMAGE_TAG="$IMAGE_TAG" docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

prune_old_release_images() {
  # Failed builds are not in the history, so also retain the tag currently
  # being deployed. A running image cannot be removed by `docker image rm`;
  # failures are warnings so cleanup can never take the live site down.
  keep_tags="$IMAGE_TAG"
  if [ -f "$history_file" ]; then
    history_tags="$(tail -n "$retain_releases" "$history_file" | awk '{print $1}')"
    keep_tags="$keep_tags $history_tags"
  fi

  for repository in web admin migrate backup; do
    docker image ls "black-whale/$repository" --format '{{.Repository}}:{{.Tag}}' |
      while IFS= read -r image; do
        [ -n "$image" ] || continue
        tag="${image##*:}"
        [ "$tag" != '<none>' ] || continue
        case " $keep_tags " in
          *" $tag "*) continue ;;
        esac
        if ! docker image rm "$image"; then
          echo "Warning: could not remove old release image $image." >&2
        fi
      done
  done
}

reclaim_build_space() {
  # BuildKit cache is useful on a workstation but unbounded on this dedicated
  # deploy host. Release images provide rollback; the cache only saves time.
  docker builder prune --all --force
  docker image prune --force
}

echo "Deploying $IMAGE_TAG"
chmod 600 "$env_file"
compose config --quiet
prune_old_release_images
reclaim_build_space
compose build --pull
# A full four-image build can fill the host before the migration container gets
# its first writable layer. The final tagged images are kept; only build cache
# and dangling intermediates are reclaimed here.
reclaim_build_space

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
prune_old_release_images
reclaim_build_space
echo "Deployed $IMAGE_TAG. To undo: infrastructure/hetzner/rollback.sh"
