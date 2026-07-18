import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(user: User, fullName?: string) {
    const name =
      fullName?.trim() ||
      (user.user_metadata?.full_name as string | undefined) ||
      '';

    // Prefer existing row
    const { data: existing, error: readErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (readErr) {
      // eslint-disable-next-line no-console
      console.error('loadProfile error', readErr.message);
    }

    if (existing) {
      setProfile(existing as Profile);
      return existing as Profile;
    }

    // Create profile if trigger didn't (or row not visible yet)
    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .upsert(
        { user_id: user.id, full_name: name, role: 'customer' },
        { onConflict: 'user_id' }
      )
      .select('*')
      .maybeSingle();

    if (insertErr) {
      // eslint-disable-next-line no-console
      console.error('ensureProfile insert error', insertErr.message);
      setProfile(null);
      return null;
    }

    setProfile(created as Profile | null);
    return created as Profile | null;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        ensureProfile(data.session.user).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        void ensureProfile(sess.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) await ensureProfile(data.user);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    // Email confirmation still enabled → user created but no session yet
    if (!data.session) {
      return {
        error: null,
        needsEmailConfirm: true,
      };
    }

    if (data.user) await ensureProfile(data.user, fullName);
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('signOut error', error.message);
    }
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await ensureProfile(session.user);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
