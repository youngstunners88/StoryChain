#!/bin/bash
#
# Citadel Backup Script
# Creates timestamped backups of critical identity and memory files
# Version: 0.7.2
#

set -e

# Configuration
WORKSPACE="${WORKSPACE:-/home/workspace}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/.citadel/backups}"
MAX_BACKUPS="${MAX_BACKUPS:-10}"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="citadel-backup-$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_PATH"

log_info "Starting citadel backup: $BACKUP_NAME"

# Files to backup (core identity files)
CORE_FILES=(
    "SELF.md"
    "SOUL.md"
    "MEMORY.md"
    "AGENTS.md"
)

# Directories to backup
CORE_DIRS=(
    "memory"
)

# Backup core files
for file in "${CORE_FILES[@]}"; do
    if [ -f "$WORKSPACE/$file" ]; then
        cp "$WORKSPACE/$file" "$BACKUP_PATH/$file"
        log_info "Backed up: $file"
    else
        log_warn "Not found: $file"
    fi
done

# Backup core directories
for dir in "${CORE_DIRS[@]}"; do
    if [ -d "$WORKSPACE/$dir" ]; then
        cp -r "$WORKSPACE/$dir" "$BACKUP_PATH/$dir"
        log_info "Backed up directory: $dir"
    else
        log_warn "Directory not found: $dir"
    fi
done

# Backup Skills directory if it exists (critical for agent capabilities)
if [ -d "$WORKSPACE/Skills" ]; then
    cp -r "$WORKSPACE/Skills" "$BACKUP_PATH/Skills"
    log_info "Backed up: Skills/"
fi

# Create manifest
cat > "$BACKUP_PATH/MANIFEST.md" << EOF
# Citadel Backup Manifest

**Backup:** $BACKUP_NAME
**Created:** $(date)
**Workspace:** $WORKSPACE

## Contents

EOF

# List backed up files
for file in "${CORE_FILES[@]}"; do
    if [ -f "$BACKUP_PATH/$file" ]; then
        size=$(wc -c < "$BACKUP_PATH/$file")
        echo "- $file ($size bytes)" >> "$BACKUP_PATH/MANIFEST.md"
    fi
done

for dir in "${CORE_DIRS[@]}"; do
    if [ -d "$BACKUP_PATH/$dir" ]; then
        count=$(find "$BACKUP_PATH/$dir" -type f | wc -l)
        echo "- $dir/ ($count files)" >> "$BACKUP_PATH/MANIFEST.md"
    fi
done

if [ -d "$BACKUP_PATH/Skills" ]; then
    count=$(find "$BACKUP_PATH/Skills" -type f | wc -l)
    echo "- Skills/ ($count files)" >> "$BACKUP_PATH/MANIFEST.md"
fi

# Calculate total backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
log_info "Backup size: $BACKUP_SIZE"

# Rotation: remove old backups if we have too many
CURRENT_BACKUPS=$(ls -1 "$BACKUP_DIR" | grep "citadel-backup-" | wc -l)
if [ "$CURRENT_BACKUPS" -gt "$MAX_BACKUPS" ]; then
    TO_REMOVE=$((CURRENT_BACKUPS - MAX_BACKUPS))
    log_info "Rotating backups (removing $TO_REMOVE oldest)"
    ls -1t "$BACKUP_DIR" | grep "citadel-backup-" | tail -n "$TO_REMOVE" | while read old_backup; do
        rm -rf "$BACKUP_DIR/$old_backup"
        log_info "Removed old backup: $old_backup"
    done
fi

# Summary
echo ""
log_info "Backup complete!"
echo "  Path: $BACKUP_PATH"
echo "  Size: $BACKUP_SIZE"
echo "  Total backups: $(ls -1 "$BACKUP_DIR" | grep "citadel-backup-" | wc -l)"
echo ""

# Exit successfully
exit 0
