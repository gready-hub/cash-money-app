import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the workspace root
config({ path: resolve(__dirname, '../../../.env') });

// Example table - you can expand this later
export const notes = pgTable('note', {
  id: serial('id').primaryKey(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Database connection
// This will work locally and can be easily switched to your NAS by updating DATABASE_URL
const connectionString = process.env['DATABASE_URL'] ?? '';

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env at:', resolve(__dirname, '../../../.env'));
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('✅ Database connection configured');
console.log(
  '📍 Connecting to:',
  connectionString.replace(/:[^:@]+@/, ':****@')
); // Hide password in logs

const client = postgres(connectionString);
export const db = drizzle(client);
