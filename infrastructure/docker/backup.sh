#!/bin/sh
set -eu

: "${POSTGRES_HOST:?POSTGRES_HOST is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

backup_interval="${BACKUP_INTERVAL_SECONDS:-86400}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p /backups

# The tables git cannot rebuild.
#
# Everything else in this database is derived: `data/` is the canon, the
# compiler replays it into Postgres on every deployment, and nothing in the web
# app writes a row. What is left is what visitors and administrators made —
# simulation branches, and the events entered through the back-office — and it
# exists nowhere else in the world. It is a small fraction of a full dump, which
# is what makes it affordable to send off the host every night while the full
# dump stays on the local volume.
#
# Prisma maps these models to identically-named tables (the schema declares no
# `@@map`), so the quoting is what keeps their capitals through psql.
STATE_TABLES='WorldBranch WorldEventRecord WorldProjectionSnapshot WorldEffectRecord NarrativeEvent Presence'

# Writes a gzipped dump, and promotes it only once it is known to hold
# something.
#
# The exit status of a pipeline is its last command's, so a failing pg_dump went
# unnoticed: gzip still succeeded compressing an empty stream, `set -e` stayed
# quiet, and the mv promoted a 20-byte file into the backup set. Two of those
# were produced while the database was unreachable. A backup that cannot be
# told apart from a real one until a restore is attempted is worse than none.
dump_to() {
  destination="$1"
  shift
  temporary="${destination}.tmp"
  if pg_dump --host "$POSTGRES_HOST" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    --format=plain --no-owner --no-acl "$@" | gzip -9 >"$temporary" &&
    [ -s "$temporary" ] &&
    [ -n "$(gzip -dc "$temporary" 2>/dev/null | head -c 1)" ]; then
    mv "$temporary" "$destination"
    return 0
  fi
  rm -f "$temporary"
  return 1
}

# Sends one dump off the host, encrypted.
#
# Encrypted here rather than at the far end, because a Storage Box is a
# filesystem belonging to somebody else: it holds ciphertext it cannot read, and
# the private key never leaves the administrator's machine. `age` is given a
# recipient public key alone, so this container never holds anything that could
# decrypt what it just wrote.
#
# A failure to send is reported and does not fail the run: the local backup is
# already on disk, and losing tonight's off-site copy is not a reason to lose
# tonight's copy altogether.
exfiltrate() {
  source_file="$1"
  [ -n "${BACKUP_REMOTE_TARGET:-}" ] || return 0

  if [ -z "${BACKUP_AGE_RECIPIENT:-}" ]; then
    echo "backup: BACKUP_REMOTE_TARGET is set but BACKUP_AGE_RECIPIENT is not;" \
      "refusing to send plaintext off the host" >&2
    return 1
  fi

  encrypted="${source_file}.age"
  if ! age --encrypt --recipient "$BACKUP_AGE_RECIPIENT" --output "$encrypted" "$source_file"; then
    rm -f "$encrypted"
    echo "backup: encryption failed, nothing sent" >&2
    return 1
  fi

  # Host key checking is left on, with a known_hosts mounted beside the key: a
  # Storage Box that suddenly presents a different host key is a refusal, not a
  # silent upload to whoever answered.
  if scp -q -o BatchMode=yes \
    -i "${BACKUP_SSH_KEY:-/run/secrets/backup_ssh_key}" \
    -o UserKnownHostsFile="${BACKUP_KNOWN_HOSTS:-/run/secrets/backup_known_hosts}" \
    -P "${BACKUP_REMOTE_PORT:-23}" \
    "$encrypted" "$BACKUP_REMOTE_TARGET"; then
    echo "backup: sent $(basename "$encrypted") off the host"
    rm -f "$encrypted"
    return 0
  fi

  echo "backup: could not send $(basename "$encrypted") off the host;" \
    "the local copy is kept" >&2
  rm -f "$encrypted"
  return 1
}

state_table_args() {
  for table in $STATE_TABLES; do
    printf -- '--table=public."%s" ' "$table"
  done
}

# Data only, and idempotent.
#
# The state dump is not a database, it is what has to be laid back *on top* of
# one: after a total loss the schema comes from the migrations and the canon
# from the compiler, both of which live in git, and only then is this replayed
# over them. Dumping the schema too would fail on the foreign keys of tables it
# does not carry, and dumping plain COPY would collide with the rows the
# compiler has already written — so the inserts say what to do about a row that
# is already there, which is nothing.
#
# The inserts name their columns. A state dump is replayed onto whatever schema
# the day of the disaster has — a fresh deployment runs the migrations at HEAD
# first — and a positional insert against a table that has gained a column
# since is either an error or, worse, a row shifted quietly by one.
STATE_DUMP_SHAPE='--data-only --column-inserts --on-conflict-do-nothing'

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

  # The full dump: the safety net, kept on the host's own volume.
  if dump_to "/backups/${POSTGRES_DB}_${timestamp}.sql.gz"; then
    # Retention only ever runs behind a dump that succeeded. Rotating after a
    # failed run would spend the retention window deleting good backups and
    # keeping nothing.
    find /backups -type f -name '*.sql.gz' ! -name '*_state_*' -mtime "+${retention_days}" -delete
  else
    echo "backup ${timestamp} failed: pg_dump produced no output, keeping previous backups" >&2
  fi

  # The state dump: what nothing else can rebuild, and the one that travels.
  state_file="/backups/${POSTGRES_DB}_state_${timestamp}.sql.gz"
  # shellcheck disable=SC2046,SC2086 # both lists are deliberately word-split
  if dump_to "$state_file" $STATE_DUMP_SHAPE $(state_table_args); then
    exfiltrate "$state_file" || true
    find /backups -type f -name '*_state_*.sql.gz' -mtime "+${retention_days}" -delete
  else
    echo "backup ${timestamp} failed: the state dump produced no output" >&2
  fi

  # One pass and out, so the restore drill can run exactly this code rather
  # than a copy of it that is free to drift.
  [ -z "${BACKUP_ONCE:-}" ] || exit 0

  sleep "$backup_interval" &
  wait $!
done
