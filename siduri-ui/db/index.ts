import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export const isDbConfigured = Boolean(connectionString && connectionString !== '');

// Initialize postgres client if connection string is provided
const client = isDbConfigured ? postgres(connectionString, { prepare: false }) : null;

export const db = client ? drizzle(client, { schema }) : null;

export { schema };
