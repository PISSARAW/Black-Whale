#!/bin/sh
set -eu
mkdir -p /backups
while :; do
  destination="/backups/umami_$(date -u '+%Y%m%dT%H%M%SZ').dump"
  if pg_dump --format=custom --no-owner --no-acl --file="$destination.tmp"; then
    mv "$destination.tmp" "$destination"
    find /backups -type f -name 'umami_*.dump' -mtime +14 -delete
  else
    rm -f "$destination.tmp"
    echo 'Umami backup failed' >&2
  fi
  sleep 86400
done
