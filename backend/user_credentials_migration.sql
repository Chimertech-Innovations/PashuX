-- SQL Migration: Store plain text passwords in public.user_credentials table

CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and grant full permissions for public access
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on user_credentials" ON public.user_credentials;

CREATE POLICY "Allow public full access on user_credentials" 
ON public.user_credentials 
FOR ALL 
USING (true) 
WITH CHECK (true);
