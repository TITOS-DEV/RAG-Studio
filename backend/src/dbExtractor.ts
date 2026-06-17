import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

export interface DbCredentials {
  host: string;
  database: string;
  user: string;
  password: string;
  port?: string;
}

export interface ExtractedRecord {
  table: string;
  content: string;
}

const MAX_ROWS_PER_TABLE = 500;
const CONNECT_TIMEOUT = 10000;

function rowToText(tableName: string, row: Record<string, unknown>): string {
  const fields = Object.entries(row)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
  return `[${tableName}] ${fields}`;
}

// ─── PostgreSQL ────────────────────────────────────────────────────────────

export async function extractPostgres(creds: DbCredentials): Promise<ExtractedRecord[]> {
  const client = new PgClient({
    host: creds.host,
    port: creds.port ? parseInt(creds.port) : 5432,
    database: creds.database,
    user: creds.user,
    password: creds.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT,
    ssl: creds.host.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const records: ExtractedRecord[] = [];

    for (const { table_name } of tablesRes.rows) {
      const dataRes = await client.query(
        `SELECT * FROM "${table_name}" LIMIT $1`,
        [MAX_ROWS_PER_TABLE]
      );
      for (const row of dataRes.rows) {
        records.push({ table: table_name, content: rowToText(table_name, row) });
      }
    }

    return records;
  } finally {
    await client.end();
  }
}

// ─── MySQL ─────────────────────────────────────────────────────────────────

export async function extractMySQL(creds: DbCredentials): Promise<ExtractedRecord[]> {
  const conn = await mysql.createConnection({
    host: creds.host,
    port: creds.port ? parseInt(creds.port) : 3306,
    database: creds.database,
    user: creds.user,
    password: creds.password,
    connectTimeout: CONNECT_TIMEOUT,
  });

  try {
    const [tables] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [creds.database]
    );

    const records: ExtractedRecord[] = [];

    for (const { table_name } of tables) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM \`${table_name}\` LIMIT ?`,
        [MAX_ROWS_PER_TABLE]
      );
      for (const row of rows) {
        records.push({ table: table_name, content: rowToText(table_name, row as Record<string, unknown>) });
      }
    }

    return records;
  } finally {
    await conn.end();
  }
}

// ─── MongoDB ───────────────────────────────────────────────────────────────

export async function extractMongoDB(creds: DbCredentials): Promise<ExtractedRecord[]> {
  const uri = `mongodb://${creds.user}:${encodeURIComponent(creds.password)}@${creds.host}:${creds.port || 27017}/${creds.database}?authSource=admin`;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: CONNECT_TIMEOUT });

  await client.connect();

  try {
    const db = client.db(creds.database);
    const collections = await db.listCollections().toArray();
    const records: ExtractedRecord[] = [];

    for (const { name } of collections) {
      const docs = await db.collection(name).find({}).limit(MAX_ROWS_PER_TABLE).toArray();
      for (const doc of docs) {
        const { _id, ...rest } = doc;
        records.push({ table: name, content: rowToText(name, rest as Record<string, unknown>) });
      }
    }

    return records;
  } finally {
    await client.close();
  }
}

// ─── Supabase (REST API via JS client) ────────────────────────────────────

export async function extractSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  tableName?: string,
  columns?: string
): Promise<ExtractedRecord[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const records: ExtractedRecord[] = [];

  if (tableName) {
    const select = columns || '*';
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .limit(MAX_ROWS_PER_TABLE);

    if (error) throw new Error(`Supabase query error on "${tableName}": ${error.message}`);

    for (const row of (data ?? [])) {
      records.push({ table: tableName, content: rowToText(tableName, row as unknown as Record<string, unknown>) });
    }
  } else {
    // Supabase REST API cannot enumerate tables without a custom RPC.
    throw new Error(
      'Para conectar Supabase debes especificar el nombre de la tabla (tableName).'
    );
  }

  return records;
}
