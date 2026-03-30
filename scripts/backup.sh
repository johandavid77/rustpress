#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="rustcms_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Mantener solo los últimos 30 backups
cd "$BACKUP_DIR"
ls -t *.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm

echo "Backup saved: ${FILENAME}"
