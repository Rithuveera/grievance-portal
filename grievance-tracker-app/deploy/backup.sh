#!/bin/bash
# Backs up the grievance database with a dated filename, keeping the last 14 days.
# Set up as a daily cron job — see DEPLOY_ORACLE.md for the crontab line to add.

APP_DIR="/home/ubuntu/grievance-tracker-app"
DB_FILE="$APP_DIR/backend/grievances.db"
BACKUP_DIR="/home/ubuntu/db-backups"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
  DATE=$(date +%Y-%m-%d)
  cp "$DB_FILE" "$BACKUP_DIR/grievances-$DATE.db"
  echo "Backed up to $BACKUP_DIR/grievances-$DATE.db"

  # Keep only the last 14 daily backups
  find "$BACKUP_DIR" -name "grievances-*.db" -mtime +14 -delete
else
  echo "Database file not found at $DB_FILE — nothing to back up."
fi
