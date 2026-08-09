-- SQL Migration to update cattle table for Video Analysis & Retest features

ALTER TABLE public.cattle
ADD COLUMN IF NOT EXISTS bcs_score numeric(3,1),
ADD COLUMN IF NOT EXISTS disease text,
ADD COLUMN IF NOT EXISTS disease_status text,
ADD COLUMN IF NOT EXISTS cleanliness_score integer DEFAULT 85,
ADD COLUMN IF NOT EXISTS breed text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS sex text,
ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2),
ADD COLUMN IF NOT EXISTS weight_range text,
ADD COLUMN IF NOT EXISTS height_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS height_range text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS coat_color text,
ADD COLUMN IF NOT EXISTS estimated_value text,
ADD COLUMN IF NOT EXISTS age_estimate text,
ADD COLUMN IF NOT EXISTS udder_score numeric(3,1),
ADD COLUMN IF NOT EXISTS teat_score numeric(3,1),
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS retest_photos jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS test_history jsonb DEFAULT '[]'::jsonb;

