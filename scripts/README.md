# Database Sync Scripts

This directory contains scripts for syncing PostgreSQL databases between different deployments (e.g., Railway production to local development).

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
  - [db-sync.sh (Bash)](#db-syncsh-bash)
  - [db-sync.mjs (Node.js)](#db-syncjs-nodejs)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)
- [Safety Tips](#safety-tips)

## Overview

These scripts help you synchronize PostgreSQL databases between different environments. Common scenarios:

- 🔄 Sync Railway production data to local for development
- 🧪 Copy production data to staging for testing
- 📊 Create data snapshots for analysis
- 🔍 Debug production issues locally

## Prerequisites

### For Both Scripts

1. **PostgreSQL Tools**: Ensure `psql` and `pg_dump` are installed
   ```bash
   # Check installation
   psql --version
   pg_dump --version
   ```

2. **Database Access**: You need connection URLs for both source and destination databases
   ```bash
   # Railway (source)
   export SOURCE_DATABASE_URL="your-railway-database-url"

   # Local (destination)
   export DEST_DATABASE_URL="postgresql://localhost/conductos"
   ```

### For Node.js Script Only

3. **Node.js Dependencies**: The Node.js script uses the `pg` package which is already in package.json

## Quick Start

### Sync Railway to Local (Full Database)

```bash
# Set environment variables
export SOURCE_DATABASE_URL="$DATABASE_URL"  # Your Railway URL
export DEST_DATABASE_URL="postgresql://localhost/conductos"

# Using bash script (recommended for full sync)
./scripts/db-sync.sh

# Or using Node.js script
node scripts/db-sync.mjs
```

### Dry Run (See What Would Happen)

```bash
# Bash version
./scripts/db-sync.sh --dry-run

# Node.js version
node scripts/db-sync.mjs --dry-run
```

## Scripts

### db-sync.sh (Bash)

**Best for**: Full database dumps and restores, simple use cases

#### Features

- ✅ Full database sync (schema + data)
- ✅ Schema-only sync
- ✅ Data-only sync
- ✅ Dry run mode
- ✅ Database statistics before/after
- ✅ Confirmation prompt
- ✅ Colored output

#### Usage

```bash
./scripts/db-sync.sh [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `-d, --dry-run` | Preview changes without executing |
| `-s, --schema-only` | Sync only schema (tables, indexes, etc.) |
| `-D, --data-only` | Sync only data (assumes schema exists) |
| `-v, --verbose` | Show detailed output |
| `-h, --help` | Show help message |

#### Examples

**Full sync with confirmation:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
./scripts/db-sync.sh
```

**Schema only (useful for updating table structures):**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
./scripts/db-sync.sh --schema-only
```

**Data only (assumes schema is up-to-date):**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
./scripts/db-sync.sh --data-only
```

**Dry run with verbose output:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
./scripts/db-sync.sh --dry-run --verbose
```

### db-sync.mjs (Node.js)

**Best for**: Selective table syncing, validation, fine-grained control

#### Features

- ✅ Selective table syncing
- ✅ Skip specific tables
- ✅ Row count validation
- ✅ Progress reporting
- ✅ Batch inserts for large tables
- ✅ Truncate mode (preserves schema)
- ✅ Detailed statistics

#### Usage

```bash
node scripts/db-sync.mjs [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `-d, --dry-run` | Preview changes without executing |
| `-v, --verbose` | Show detailed output including SQL |
| `--validate` | Validate row counts after sync |
| `--tables <list>` | Sync only specified tables (comma-separated) |
| `--skip-tables <list>` | Skip specified tables (comma-separated) |
| `--truncate` | Truncate tables instead of DELETE (faster) |
| `-h, --help` | Show help message |

#### Examples

**Sync specific tables only:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --tables users,cases,ic_members
```

**Sync all except audit/log tables:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --skip-tables admin_audit_log,agent_interactions
```

**Full sync with validation:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --validate
```

**Dry run with verbose output:**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --dry-run --verbose
```

**Truncate mode (faster for large tables):**
```bash
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --truncate
```

## Common Use Cases

### 1. Daily Development Sync

Sync production data to local every morning:

```bash
#!/bin/bash
# Save as: sync-dev.sh

export SOURCE_DATABASE_URL="your-railway-url"
export DEST_DATABASE_URL="postgresql://localhost/conductos"

# Sync all except audit logs (to keep local clean)
node scripts/db-sync.mjs \
  --skip-tables admin_audit_log,agent_interactions \
  --validate
```

### 2. Testing Schema Changes

Test schema changes before deploying:

```bash
# First, sync schema only
./scripts/db-sync.sh --schema-only

# Test your migrations locally
npm run db:migrate

# If successful, sync data
./scripts/db-sync.sh --data-only
```

### 3. Debugging Production Issues

Get exact production data locally:

```bash
# Full sync with validation
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos" \
node scripts/db-sync.mjs --validate --verbose
```

### 4. Sync Specific Case for Investigation

```bash
# Sync only relevant tables
node scripts/db-sync.mjs \
  --tables cases,case_history,users,ic_members \
  --validate
```

### 5. Create Development Snapshots

```bash
# Sync to a snapshot database
SOURCE_DATABASE_URL="$DATABASE_URL" \
DEST_DATABASE_URL="postgresql://localhost/conductos_snapshot_$(date +%Y%m%d)" \
./scripts/db-sync.sh
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to source/destination database

**Solutions**:
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check network access (Railway may require IP whitelisting for some plans)
- Ensure PostgreSQL is running locally: `sudo service postgresql status`
- Test connection manually: `psql "$DATABASE_URL" -c "SELECT 1"`

### Permission Errors

**Problem**: Permission denied when creating tables

**Solutions**:
- Ensure destination user has CREATE privileges
- For local: `ALTER USER your_user CREATEDB;`
- Use `--data-only` if schema already exists

### Large Database Issues

**Problem**: Sync takes too long or runs out of memory

**Solutions**:
- Use bash script with `--data-only` for initial sync
- Use Node.js script with `--tables` to sync incrementally
- Use `--truncate` option for faster data replacement
- Sync during off-peak hours

### Row Count Mismatches

**Problem**: Validation shows different row counts

**Possible causes**:
- Ongoing writes to source during sync
- Foreign key constraint violations
- Sequence values not synced (use bash script for full sync)

**Solutions**:
- Run sync again during quiet period
- Use bash script for atomic dump/restore
- Check error logs for constraint violations

### Schema Already Exists

**Problem**: Tables already exist in destination

**Solutions**:
- Bash script automatically uses `--clean` flag (drops existing objects)
- Node.js script deletes all rows by default
- Or manually drop schema: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`

## Safety Tips

### ⚠️ Important Warnings

1. **NEVER sync TO production** - These scripts are meant to sync FROM production to dev/staging
2. **Backup first** - Always backup destination before syncing:
   ```bash
   pg_dump "$DEST_DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Use dry-run** - Always run with `--dry-run` first to preview changes
4. **Check connections** - Verify you're syncing to the correct database

### 🔒 Security Best Practices

1. **Never commit credentials** - Use environment variables, never hardcode URLs
2. **Use .env files** - Store DATABASE_URLs in `.env` (already gitignored)
3. **Limit access** - Use read-only users for source when possible
4. **Sanitize sensitive data** - Consider removing PII after sync:
   ```sql
   UPDATE users SET email = CONCAT('user', id, '@example.com');
   UPDATE cases SET description = 'Sanitized for development';
   ```

### 📝 Pre-Sync Checklist

Before running sync:

- [ ] Verified source and destination URLs
- [ ] Ran with `--dry-run` first
- [ ] Backed up destination database (if contains important data)
- [ ] Confirmed no active development work that would be lost
- [ ] Checked available disk space
- [ ] Scheduled sync during quiet period (for large databases)

### 💡 Performance Tips

1. **Use bash script for full syncs** - Faster for large databases
2. **Use Node.js script for selective syncs** - More control, better for partial updates
3. **Skip large audit tables** - Use `--skip-tables` for logs you don't need
4. **Use `--truncate`** - Faster than DELETE for large tables
5. **Sync incrementally** - Use `--tables` to sync one table at a time for very large databases

## Environment Variables Reference

```bash
# Required
export SOURCE_DATABASE_URL="postgresql://user:pass@host:port/dbname"
export DEST_DATABASE_URL="postgresql://localhost/conductos"

# Optional (for Railway)
export DATABASE_URL="postgresql://..."  # Can use as SOURCE_DATABASE_URL

# Example .env file (don't commit!)
SOURCE_DATABASE_URL=postgresql://postgres:password@railway.app:5432/railway
DEST_DATABASE_URL=postgresql://localhost/conductos
```

## Automation

### Create an Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias sync-from-railway='SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh'
```

Then simply run:
```bash
sync-from-railway
```

### Cron Job (Daily Sync)

```bash
# Edit crontab
crontab -e

# Add daily sync at 6 AM
0 6 * * * cd /path/to/conductos && SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" ./scripts/db-sync.sh --skip-tables admin_audit_log
```

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review script help: `./scripts/db-sync.sh --help`
3. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
4. Open an issue on GitHub

## License

Part of ConductOS - PoSH Compliance Management System
