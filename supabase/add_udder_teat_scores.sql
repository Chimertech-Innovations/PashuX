-- ============================================================
-- Migration: Add udder_score and teat_score to cattle table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to re-run (uses IF NOT EXISTS pattern)
-- ============================================================

-- Add udder_score column (0-5 scale, null = not captured)
ALTER TABLE public.cattle
  ADD COLUMN IF NOT EXISTS udder_score numeric(3,1) DEFAULT NULL
    CHECK (udder_score IS NULL OR (udder_score >= 0.0 AND udder_score <= 5.0));

-- Add teat_score column (0-5 scale, null = not captured)
ALTER TABLE public.cattle
  ADD COLUMN IF NOT EXISTS teat_score numeric(3,1) DEFAULT NULL
    CHECK (teat_score IS NULL OR (teat_score >= 0.0 AND teat_score <= 5.0));

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cattle'
  AND column_name IN ('udder_score', 'teat_score');
