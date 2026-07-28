#!/bin/sh
set -eu

: "${POSTGRES_HOST:?POSTGRES_HOST is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

backup_interval="${BACKUP_INTERVAL_SECONDS:-86400}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p /backups

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  destination="/backups/${POSTGRES_DB}_${timestamp}.sql.gz"
  temporary="${destination}.tmp"
  # The exit status of a pipeline is its last command's, so a failing pg_dump
  # went unnoticed: gzip still succeeded compressing an empty stream, `set -e`
  # stayed quiet, and the mv promoted a 20-byte file into the backup set. Two of
  # those were produced while the database was unreachable. A backup that cannot
  # be distinguished from a real one until a restore is attempted is worse than
  # no backup, so the dump is only promoted once it is known to hold something.
  if pg_dump --host "$POSTGRES_HOST" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=plain --no-owner --no-acl | gzip -9 > "$temporary" &&
    [ -s "$temporary" ] &&
    [ -n "$(gzip -dc "$temporary" 2>/dev/null | head -c 1)" ]; then
    mv "$temporary" "$destination"
    # Retention only ever runs behind a dump that succeeded. Rotating on a failed
    # run would spend the retention window deleting good backups and keeping
    # nothing.
    find /backups -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
  else
    rm -f "$temporary"
    echo "backup ${timestamp} failed: pg_dump produced no output, keeping previous backups" >&2
  fi
  sleep "$backup_interval" &
  wait $!
done
