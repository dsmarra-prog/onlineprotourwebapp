-- Migration 0002: Support Tickets
-- Applied via: cd lib/db && pnpm run push

CREATE TABLE IF NOT EXISTS "tour_support_tickets" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" integer NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "status" text DEFAULT 'offen' NOT NULL, -- offen | beantwortet | geschlossen
  "admin_reply" text,
  "replied_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "replied_at" timestamp
);
