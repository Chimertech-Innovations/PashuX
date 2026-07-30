import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]     = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const adminEmail = (import.meta.env.VITE_ADMIN_USERNAME || 'admin@chimertech.ai').toLowerCase();
  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'AdminPassword123!';

  const checkIsAdmin = (u: User | null, emailToCheck?: string) => {
    const e = (emailToCheck || u?.email || '').toLowerCase();
    const isAdm = e === adminEmail || u?.user_metadata?.role === 'admin';
    setIsAdmin(isAdm);
    return isAdm;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      checkIsAdmin(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      checkIsAdmin(sess?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if input credentials match configured Admin credentials in .env
    if (cleanEmail === adminEmail && password === adminPass) {
      // Attempt standard supabase signin or fallback to admin session
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        // If Supabase user doesn't exist yet, sign up then sign in
        await supabase.auth.signUp({
          email: cleanEmail,
          password: adminPass,
          options: { data: { full_name: 'System Admin', role: 'admin' } },
        }).catch(() => {});
        await supabase.auth.signInWithPassword({ email: cleanEmail, password }).catch(() => {});
      }
      setIsAdmin(true);
      return true; // Is admin
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const isAdm = checkIsAdmin(data.user);
    return isAdm;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw new Error(error.message);

    // Auto sign-in immediately for direct email & password login
    if (!data.session) {
      await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
    }
  };

  const signOut = async () => {
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
