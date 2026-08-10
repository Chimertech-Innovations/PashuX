-- SQL Migration to update cattle table for Pashu Score features

ALTER TABLE public.cattle
ADD COLUMN IF NOT EXISTS pashu_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pashu_score_breakdown jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manure_score numeric(3,1) DEFAULT NULL;

