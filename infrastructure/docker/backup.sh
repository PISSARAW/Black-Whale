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
  pg_dump --host "$POSTGRES_HOST" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=plain --no-owner --no-acl | gzip -9 > "$temporary"
  mv "$temporary" "$destination"
  find /backups -type f -name '*.sql.gz' -mtime "+${retention_days}" -delete
  sleep "$backup_interval" &
  wait $!
done
