#!/bin/bash
# ==========================================================
# FEDPAWA - Backup quotidien de la base SQLite
# Crontab recommandé (3h30 du matin) :
#   30 3 * * * /bin/bash /chemin/vers/fedpawa_light/scripts/backup_database.sh >> /chemin/vers/fedpawa_light/storage/logs/backup.log 2>&1
# ==========================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$PROJECT_DIR/storage/fedpawa.sqlite"
BACKUP_DIR="$PROJECT_DIR/storage/backups"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y-%m-%d)
TARGET="$BACKUP_DIR/fedpawa_$DATE.sqlite"

if [ ! -f "$DB_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERREUR : base introuvable : $DB_FILE"
    exit 1
fi

# .backup = copie cohérente même si la base est en cours d'écriture (safe avec WAL)
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_FILE" ".backup '$TARGET'"
else
    # Fallback sans sqlite3 : copie brute après checkpoint WAL (moins sûr, mais fonctionnel)
    php -r '$db = new PDO("sqlite:" . $argv[1]); $db->exec("PRAGMA wal_checkpoint(TRUNCATE)");' "$DB_FILE"
    cp "$DB_FILE" "$TARGET"
fi

if [ ! -s "$TARGET" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERREUR : backup vide : $TARGET"
    exit 1
fi

chmod 600 "$TARGET"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup OK : $TARGET ($(du -h "$TARGET" | cut -f1))"

# Rotation : purge des backups de plus de KEEP_DAYS jours
find "$BACKUP_DIR" -name 'fedpawa_*.sqlite' -type f -mtime +$KEEP_DAYS -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotation effectuée (conservation : $KEEP_DAYS jours)"
