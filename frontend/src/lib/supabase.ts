import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = "https://orafimsbfkbrierpocon.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYWZpbXNiZmticmllcnBvY29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIxNzQsImV4cCI6MjEwMDg3ODE3NH0.8DfR2BItU7bt4c1umjjU2WwyAFxk642IyghzLKnkwz0";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

