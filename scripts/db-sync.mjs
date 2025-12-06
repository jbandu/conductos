#!/usr/bin/env node

/**
 * Advanced Database Sync Script for ConductOS
 *
 * Provides fine-grained control over database synchronization including:
 * - Selective table syncing
 * - Row count comparison
 * - Data validation
 * - Progress reporting
 *
 * Usage: node scripts/db-sync.js [options]
 */

import pg from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const { Pool } = pg;

// Configuration
const config = {
  source: process.env.SOURCE_DATABASE_URL,
  destination: process.env.DEST_DATABASE_URL,
  dryRun: process.argv.includes('--dry-run') || process.argv.includes('-d'),
  tables: process.argv.includes('--tables') ? process.argv[process.argv.indexOf('--tables') + 1]?.split(',') : null,
  skipTables: process.argv.includes('--skip-tables') ? process.argv[process.argv.indexOf('--skip-tables') + 1]?.split(',') : null,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  validate: process.argv.includes('--validate'),
  truncate: process.argv.includes('--truncate')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red,
    DEBUG: colors.cyan
  };

  const color = colorMap[level] || colors.reset;
  console.log(`${color}[${level}]${colors.reset} ${message}`);
}

function showHelp() {
  console.log(`
Database Sync Script (Advanced) for ConductOS

Usage: node scripts/db-sync.js [OPTIONS]

Environment Variables Required:
  SOURCE_DATABASE_URL    - Source database connection string
  DEST_DATABASE_URL      - Destination database connection string

Options:
  -d, --dry-run                Show what would be synced without making changes
  -v, --verbose                Show detailed output including SQL queries
  --validate                   Validate row counts after sync
  --tables <table1,table2>     Sync only specified tables (comma-separated)
  --skip-tables <table1,table2> Skip specified tables (comma-separated)
  --truncate                   Truncate destination tables before copying (preserves schema)
  -h, --help                   Show this help message

Examples:
  # Full sync with validation
  SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" \\
    node scripts/db-sync.js --validate

  # Sync specific tables only
  SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" \\
    node scripts/db-sync.js --tables users,cases,ic_members

  # Sync all except audit tables
  SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" \\
    node scripts/db-sync.js --skip-tables admin_audit_log,agent_interactions

  # Dry run to preview changes
  SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" \\
    node scripts/db-sync.js --dry-run --verbose

  # Truncate and reload data (keeps schema)
  SOURCE_DATABASE_URL=$DATABASE_URL DEST_DATABASE_URL="postgresql://localhost/conductos" \\
    node scripts/db-sync.js --truncate
`);
}

async function getTableList(pool, schema = 'public') {
  const query = `
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = $1
    ORDER BY tablename
  `;

  const result = await pool.query(query, [schema]);
  return result.rows.map(row => row.tablename);
}

async function getRowCount(pool, tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    log('ERROR', `Failed to count rows in ${tableName}: ${error.message}`);
    return -1;
  }
}

async function getDatabaseStats(pool) {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
      (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as view_count,
      (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size,
      (SELECT SUM(n_live_tup) FROM pg_stat_user_tables) as total_rows
  `;

  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    log('ERROR', `Failed to get database stats: ${error.message}`);
    return null;
  }
}

async function compareTables(sourceTables, destTables) {
  const sourceSet = new Set(sourceTables);
  const destSet = new Set(destTables);

  const onlyInSource = sourceTables.filter(t => !destSet.has(t));
  const onlyInDest = destTables.filter(t => !sourceSet.has(t));
  const common = sourceTables.filter(t => destSet.has(t));

  return { onlyInSource, onlyInDest, common };
}

async function syncTable(sourcePool, destPool, tableName, options = {}) {
  const { dryRun, truncate, verbose } = options;

  try {
    // Get row count from source
    const sourceCount = await getRowCount(sourcePool, tableName);

    if (dryRun) {
      log('INFO', `Would sync table: ${tableName} (${sourceCount} rows)`);
      return { success: true, table: tableName, rows: sourceCount };
    }

    if (verbose) {
      log('DEBUG', `Syncing table: ${tableName}...`);
    }

    // Get table data from source
    const sourceData = await sourcePool.query(`SELECT * FROM ${tableName}`);

    if (truncate) {
      // Truncate destination table
      await destPool.query(`TRUNCATE TABLE ${tableName} CASCADE`);
      if (verbose) {
        log('DEBUG', `Truncated table: ${tableName}`);
      }
    } else {
      // Delete all rows from destination
      await destPool.query(`DELETE FROM ${tableName}`);
      if (verbose) {
        log('DEBUG', `Deleted all rows from: ${tableName}`);
      }
    }

    // Insert data if there are rows
    if (sourceData.rows.length > 0) {
      const columns = Object.keys(sourceData.rows[0]);
      const columnNames = columns.join(', ');

      // Insert in batches to avoid memory issues
      const batchSize = 1000;
      let inserted = 0;

      for (let i = 0; i < sourceData.rows.length; i += batchSize) {
        const batch = sourceData.rows.slice(i, i + batchSize);

        const values = batch.map((row, idx) => {
          const rowValues = columns.map((col, colIdx) => {
            const value = row[col];
            return `$${idx * columns.length + colIdx + 1}`;
          }).join(', ');
          return `(${rowValues})`;
        }).join(', ');

        const flatValues = batch.flatMap(row => columns.map(col => row[col]));

        const insertQuery = `
          INSERT INTO ${tableName} (${columnNames})
          VALUES ${values}
        `;

        await destPool.query(insertQuery, flatValues);
        inserted += batch.length;

        if (verbose && sourceData.rows.length > batchSize) {
          log('DEBUG', `  Inserted ${inserted}/${sourceData.rows.length} rows`);
        }
      }
    }

    log('SUCCESS', `Synced ${tableName}: ${sourceData.rows.length} rows`);
    return { success: true, table: tableName, rows: sourceData.rows.length };

  } catch (error) {
    log('ERROR', `Failed to sync table ${tableName}: ${error.message}`);
    if (verbose) {
      console.error(error);
    }
    return { success: false, table: tableName, error: error.message };
  }
}

async function validateSync(sourcePool, destPool, tables) {
  log('INFO', 'Validating row counts...');

  const mismatches = [];

  for (const table of tables) {
    const sourceCount = await getRowCount(sourcePool, table);
    const destCount = await getRowCount(destPool, table);

    if (sourceCount !== destCount) {
      mismatches.push({ table, source: sourceCount, dest: destCount });
      log('WARNING', `Row count mismatch in ${table}: source=${sourceCount}, dest=${destCount}`);
    } else {
      log('SUCCESS', `Validated ${table}: ${sourceCount} rows`);
    }
  }

  return mismatches;
}

async function main() {
  // Show help if requested
  if (process.argv.includes('-h') || process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Validate environment variables
  if (!config.source) {
    log('ERROR', 'SOURCE_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!config.destination) {
    log('ERROR', 'DEST_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  log('INFO', 'Starting database sync...');
  console.log('');

  // Create connection pools
  const sourcePool = new Pool({ connectionString: config.source });
  const destPool = new Pool({ connectionString: config.destination });

  try {
    // Test connections
    await sourcePool.query('SELECT NOW()');
    await destPool.query('SELECT NOW()');
    log('SUCCESS', 'Connected to both databases');
    console.log('');

    // Get database stats
    log('INFO', 'Source Database:');
    const sourceStats = await getDatabaseStats(sourcePool);
    console.log(`  Tables: ${sourceStats.table_count}, Views: ${sourceStats.view_count}`);
    console.log(`  Total Rows: ${sourceStats.total_rows}, Size: ${sourceStats.db_size}`);
    console.log('');

    log('INFO', 'Destination Database (BEFORE):');
    const destStatsBefore = await getDatabaseStats(destPool);
    console.log(`  Tables: ${destStatsBefore.table_count}, Views: ${destStatsBefore.view_count}`);
    console.log(`  Total Rows: ${destStatsBefore.total_rows}, Size: ${destStatsBefore.db_size}`);
    console.log('');

    // Get table lists
    const sourceTables = await getTableList(sourcePool);
    const destTables = await getTableList(destPool);

    const comparison = await compareTables(sourceTables, destTables);

    if (comparison.onlyInSource.length > 0) {
      log('WARNING', `Tables only in source: ${comparison.onlyInSource.join(', ')}`);
    }

    if (comparison.onlyInDest.length > 0) {
      log('WARNING', `Tables only in destination: ${comparison.onlyInDest.join(', ')}`);
    }

    // Determine which tables to sync
    let tablesToSync = comparison.common;

    if (config.tables) {
      tablesToSync = tablesToSync.filter(t => config.tables.includes(t));
      log('INFO', `Syncing only specified tables: ${tablesToSync.join(', ')}`);
    }

    if (config.skipTables) {
      tablesToSync = tablesToSync.filter(t => !config.skipTables.includes(t));
      log('INFO', `Skipping tables: ${config.skipTables.join(', ')}`);
    }

    console.log('');
    log('INFO', `Tables to sync: ${tablesToSync.length}`);
    console.log('');

    if (config.dryRun) {
      log('WARNING', 'DRY RUN MODE - No changes will be made');
      console.log('');
    }

    // Sync tables
    const results = [];
    for (const table of tablesToSync) {
      const result = await syncTable(sourcePool, destPool, table, {
        dryRun: config.dryRun,
        truncate: config.truncate,
        verbose: config.verbose
      });
      results.push(result);
    }

    console.log('');

    // Validate if requested
    if (config.validate && !config.dryRun) {
      const mismatches = await validateSync(sourcePool, destPool, tablesToSync);

      if (mismatches.length === 0) {
        log('SUCCESS', 'All tables validated successfully!');
      } else {
        log('WARNING', `${mismatches.length} table(s) have row count mismatches`);
      }
      console.log('');
    }

    // Show final stats
    if (!config.dryRun) {
      log('INFO', 'Destination Database (AFTER):');
      const destStatsAfter = await getDatabaseStats(destPool);
      console.log(`  Tables: ${destStatsAfter.table_count}, Views: ${destStatsAfter.view_count}`);
      console.log(`  Total Rows: ${destStatsAfter.total_rows}, Size: ${destStatsAfter.db_size}`);
      console.log('');
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log('SUCCESS', `Sync completed: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      log('ERROR', 'Failed tables:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.table}: ${r.error}`);
      });
      process.exit(1);
    }

  } catch (error) {
    log('ERROR', `Sync failed: ${error.message}`);
    if (config.verbose) {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await sourcePool.end();
    await destPool.end();
  }
}

// Run the script
main();
