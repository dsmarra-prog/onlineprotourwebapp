-- Production updates that are applied on every deployment.
-- These are idempotent UPDATE/INSERT statements for admin overrides.
-- Add new rows here for PIN resets or other admin corrections.

-- PIN reset: Mehdi / Mehdimahdartsvikia -> 1234
UPDATE public.tour_players
SET pin_hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
WHERE autodarts_username = 'Mehdimahdartsvikia';
