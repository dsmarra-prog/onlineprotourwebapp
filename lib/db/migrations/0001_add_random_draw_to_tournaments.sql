-- Migration: Add random_draw flag to tour_tournaments
-- Applied via: drizzle-kit push (project uses push-based schema management)
-- Date: 2026-03-30

ALTER TABLE tour_tournaments
  ADD COLUMN IF NOT EXISTS random_draw BOOLEAN NOT NULL DEFAULT false;
