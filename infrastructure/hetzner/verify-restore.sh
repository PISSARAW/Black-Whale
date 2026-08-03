#!/bin/sh
set -eu

# Proves the newest backups can be restored, without touching the live database.
#
# `backup.sh` already refuses to promote a dump that is empty, which catches a
# database that was unreachable. It cannot catch a dump that is complete and
# unusable — a schema the current Postgres will not accept, a state dump whose
# inserts collide, a restore path that stopped working the day an option
# changed. Nothing here had ever been run except by hand, after a disaster,
# which is the worst moment to discover any of it.
#
# So this is the drill: the newest full dump is restored into a scratch
# database beside the real one, the newest state dump is replayed on top of it
# exactly as a recovery would replay it, a handful of things are counted, and
# the scratch database is dropped. It never writes to $POSTGRES_DB, and it is
# safe to run on a live host.
#
# Run it weekly. `infrastructure/hetzner/README.md` §7 has the cron line.

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
compose_file="$project_dir/infrastructure/docker/docker-compose.prod.yml"
env_file="${1:-$project_dir/.env.production}"

test -f "$env_file" || {
  echo "No environment file at $env_file" >&2
  exit 1
}
set -a
# shellcheck disable=SC1090 # the operator names the file
. "$env_file"
set +a

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

scratch="${POSTGRES_DB}_restorecheck"
psql_scratch() {
  compose exec -T postgres psql --username "$POSTGRES_USER" --dbname "$scratch" \
    --set ON_ERROR_STOP=on "$@"
}

newest() {
  compose exec -T backup sh -c "ls -1t /backups/$1 2>/dev/null | head -1"
}

cleanup() {
  compose exec -T postgres dropdb --username "$POSTGRES_USER" --if-exists "$scratch" >/dev/null 2>&1 || true
}
trap cleanup EXIT

full_dump="$(newest "${POSTGRES_DB}_2*.sql.gz" | tr -d '\r')"
state_dump="$(newest "${POSTGRES_DB}_state_*.sql.gz" | tr -d '\r')"

test -n "$full_dump" || {
  echo "restore drill: no full dump in /backups" >&2
  exit 1
}
test -n "$state_dump" || {
  echo "restore drill: no state dump in /backups" >&2
  exit 1
}

echo "restore drill: full=$(basename "$full_dump") state=$(basename "$state_dump")"

cleanup
compose exec -T postgres createdb --username "$POSTGRES_USER" "$scratch"

# The full dump first: schema and canon, as a fresh server would have them
# after `deploy.sh` had run the migrations and the compiler.
compose exec -T backup sh -c "gzip -dc '$full_dump'" |
  psql_scratch >/dev/null

# Then the state dump over the top, which is the half of the recovery nobody
# had ever rehearsed. It is `--on-conflict-do-nothing`, so replaying it over
# rows that are already there has to be a no-op rather than an error.
compose exec -T backup sh -c "gzip -dc '$state_dump'" |
  psql_scratch >/dev/null

# …and again, because an idempotent restore that is only ever applied once is
# an idempotent restore nobody has checked.
compose exec -T backup sh -c "gzip -dc '$state_dump'" |
  psql_scratch >/dev/null

count() {
  psql_scratch --tuples-only --no-align --command "SELECT count(*) FROM public.\"$1\";" | tr -d '\r'
}

failures=0
require_rows() {
  rows="$(count "$1")"
  if [ "$rows" -gt 0 ]; then
    echo "  $1: $rows rows"
  else
    echo "  $1: EMPTY — the restore is not usable" >&2
    failures=$((failures + 1))
  fi
}

# The canon has to be there, or the site would come back blank…
require_rows Character
require_rows NarrativeEvent
require_rows Chapter

# …and so does what only the visitors made, or the restore lost the one thing
# git cannot give back. An archive with no simulation branches yet is a legal
# state, so this counts rather than requires.
echo "  WorldBranch: $(count WorldBranch) rows (nothing to require: a young archive has none)"
echo "  WorldEventRecord: $(count WorldEventRecord) rows"

if [ "$failures" -gt 0 ]; then
  echo "restore drill FAILED: $failures table(s) came back empty" >&2
  exit 1
fi

echo "restore drill passed: both dumps restore, and the state dump replays twice"
