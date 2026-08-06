-- SQL Migration to update cattle table for Video Analysis features

-- Add new columns to store the full historical data from the video analysis
ALTER TABLE public.cattle
ADD COLUMN IF NOT EXISTS bcs_score numeric(3,1),
ADD COLUMN IF NOT EXISTS disease text,
ADD COLUMN IF NOT EXISTS breed text,
ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2),
ADD COLUMN IF NOT EXISTS height_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS estimated_value text,
ADD COLUMN IF NOT EXISTS video_url text;

-- Update the Supabase RPC function (match_cattle_muzzle) to return all fields if necessary, 
-- or we can just fetch them via standard select since the RPC already returns the whole row usually.
-- (Assuming the existing RPC returns the full row by default based on how it's called)
