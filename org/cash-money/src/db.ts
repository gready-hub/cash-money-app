import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import postgres from 'postgres';

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
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
export const db = drizzle(client);
