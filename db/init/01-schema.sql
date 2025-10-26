-- Initial schema for Cash Money application
-- This will be automatically executed when the PostgreSQL container first starts

-- Create sequence for note IDs
CREATE SEQUENCE IF NOT EXISTS note_id_seq;

-- Create notes table (example table from Spartan Stack guide)
CREATE TABLE IF NOT EXISTS note (
    id BIGINT NOT NULL DEFAULT nextval('note_id_seq'::regclass),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notes_pkey PRIMARY KEY (id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_created_at ON note(created_at);

-- Future tables for Cash Money app:
-- - transactions (bank transactions)
-- - categories (transaction categories)
-- - bank_statements (imported CSV files)
-- - reports (generated financial reports)
