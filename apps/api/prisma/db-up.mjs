import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function main() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is required in apps/api/.env');

  const url = new URL(value);
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }

  const database = decodeURIComponent(url.pathname.slice(1));
  if (!database || Buffer.byteLength(database, 'utf8') > 63 || database.includes('\0')) {
    throw new Error('DATABASE_URL must name a valid database (1–63 bytes)');
  }

  // Connect to the maintenance database because the target may not exist yet.
  url.pathname = '/postgres';
  url.searchParams.delete('schema'); // Prisma-specific option, not a pg connection option.
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (existing.rowCount) {
      console.log(`Database "${database}" already exists.`);
      return;
    }

    // PostgreSQL does not accept identifiers as query parameters.
    const identifier = `"${database.replaceAll('"', '""')}"`;
    try {
      await client.query(`CREATE DATABASE ${identifier}`);
      console.log(`Created blank database "${database}".`);
    } catch (error) {
      // A concurrent db:up may have created it after the existence check.
      if (error.code !== '42P04') throw error;
      console.log(`Database "${database}" already exists.`);
    }
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
