#!/bin/bash

# Database Sync Script
# Syncs PostgreSQL database from source to destination
# Usage: ./scripts/db-sync.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
DATA_ONLY=false
SCHEMA_ONLY=false
VERBOSE=false
TEMP_FILE="/tmp/conductos_sync_$(date +%s).sql"

# Help text
show_help() {
    cat << EOF
Database Sync Script for ConductOS

Usage: ./scripts/db-sync.sh [OPTIONS]

Syncs PostgreSQL database from source (Railway) to destination (Local).
Uses environment variables for database connections.

Environment Variables Required:
  SOURCE_DATABASE_URL    - Source database connection string (Railway)
  DEST_DATABASE_URL      - Destination database connection string (Local)

Options:
  -d, --dry-run         Show what would be synced without making changes
  -s, --schema-only     Sync only schema (tables, indexes, etc.) without data
  -D, --data-only       Sync only data (assumes schema already exists)
  -v, --verbose         Show detailed output
  -h, --help            Show this help message

Examples:
  # Full sync from Railway to Local
  SOURCE_DATABASE_URL=\$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh

  # Dry run to see what would be synced
  SOURCE_DATABASE_URL=\$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh --dry-run

  # Sync only schema
  SOURCE_DATABASE_URL=\$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh --schema-only

  # Sync only data
  SOURCE_DATABASE_URL=\$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh --data-only

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        -D|--data-only)
            DATA_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check for required environment variables
if [ -z "$SOURCE_DATABASE_URL" ]; then
    echo -e "${RED}Error: SOURCE_DATABASE_URL environment variable is required${NC}"
    echo "Example: export SOURCE_DATABASE_URL=\"postgresql://user:pass@host/dbname\""
    exit 1
fi

if [ -z "$DEST_DATABASE_URL" ]; then
    echo -e "${RED}Error: DEST_DATABASE_URL environment variable is required${NC}"
    echo "Example: export DEST_DATABASE_URL=\"postgresql://localhost/conductos\""
    exit 1
fi

# Validate conflicting options
if [ "$SCHEMA_ONLY" = true ] && [ "$DATA_ONLY" = true ]; then
    echo -e "${RED}Error: Cannot use --schema-only and --data-only together${NC}"
    exit 1
fi

# Function to log messages
log() {
    local level=$1
    shift
    local message="$@"

    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Function to get database info
get_db_info() {
    local db_url=$1
    local info=$(psql "$db_url" -t -c "SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as view_count,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size;" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "$info"
    else
        echo "Unable to connect"
    fi
}

# Main sync function
perform_sync() {
    log INFO "Starting database sync..."
    echo ""

    # Show source database info
    log INFO "Source Database Information:"
    SOURCE_INFO=$(get_db_info "$SOURCE_DATABASE_URL")
    if [ "$SOURCE_INFO" != "Unable to connect" ]; then
        echo "$SOURCE_INFO" | awk '{print "  Tables: "$1", Views: "$2", Size: "$3}'
    else
        log ERROR "Cannot connect to source database"
        exit 1
    fi
    echo ""

    # Show destination database info
    log INFO "Destination Database Information (BEFORE):"
    DEST_INFO=$(get_db_info "$DEST_DATABASE_URL")
    if [ "$DEST_INFO" != "Unable to connect" ]; then
        echo "$DEST_INFO" | awk '{print "  Tables: "$1", Views: "$2", Size: "$3}'
    else
        log ERROR "Cannot connect to destination database"
        exit 1
    fi
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log WARNING "DRY RUN MODE - No changes will be made"
        echo ""
        log INFO "Would perform the following actions:"
        echo "  1. Dump source database to temporary file"
        if [ "$SCHEMA_ONLY" = true ]; then
            echo "     Mode: Schema only (--schema-only)"
        elif [ "$DATA_ONLY" = true ]; then
            echo "     Mode: Data only (--data-only)"
        else
            echo "     Mode: Full sync (schema + data)"
        fi
        echo "  2. Restore dump to destination database"
        echo "  3. Clean up temporary file"
        echo ""
        log SUCCESS "Dry run completed. Use without --dry-run to perform actual sync."
        return 0
    fi

    # Confirm before proceeding
    log WARNING "This will overwrite the destination database!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log INFO "Sync cancelled by user"
        exit 0
    fi

    # Prepare pg_dump options
    DUMP_OPTIONS="--no-owner --no-acl --clean --if-exists"

    if [ "$SCHEMA_ONLY" = true ]; then
        DUMP_OPTIONS="$DUMP_OPTIONS --schema-only"
        log INFO "Dumping schema only from source database..."
    elif [ "$DATA_ONLY" = true ]; then
        DUMP_OPTIONS="$DUMP_OPTIONS --data-only"
        log INFO "Dumping data only from source database..."
    else
        log INFO "Dumping full database (schema + data) from source..."
    fi

    if [ "$VERBOSE" = true ]; then
        DUMP_OPTIONS="$DUMP_OPTIONS --verbose"
    fi

    # Dump source database
    if pg_dump "$SOURCE_DATABASE_URL" $DUMP_OPTIONS > "$TEMP_FILE" 2>/dev/null; then
        log SUCCESS "Database dump created: $TEMP_FILE"
        DUMP_SIZE=$(du -h "$TEMP_FILE" | cut -f1)
        log INFO "Dump file size: $DUMP_SIZE"
    else
        log ERROR "Failed to dump source database"
        rm -f "$TEMP_FILE"
        exit 1
    fi

    echo ""
    log INFO "Restoring to destination database..."

    # Restore to destination
    if [ "$VERBOSE" = true ]; then
        psql "$DEST_DATABASE_URL" < "$TEMP_FILE"
    else
        psql "$DEST_DATABASE_URL" < "$TEMP_FILE" > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        log SUCCESS "Database restored successfully"
    else
        log ERROR "Failed to restore database"
        log INFO "Temp file preserved for debugging: $TEMP_FILE"
        exit 1
    fi

    # Clean up
    rm -f "$TEMP_FILE"
    log INFO "Cleaned up temporary files"

    echo ""
    log INFO "Destination Database Information (AFTER):"
    DEST_INFO_AFTER=$(get_db_info "$DEST_DATABASE_URL")
    echo "$DEST_INFO_AFTER" | awk '{print "  Tables: "$1", Views: "$2", Size: "$3}'

    echo ""
    log SUCCESS "Database sync completed successfully!"
}

# Cleanup on exit
trap 'rm -f "$TEMP_FILE"' EXIT

# Run the sync
perform_sync
