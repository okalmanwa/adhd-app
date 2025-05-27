'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Create a single Supabase instance outside the component
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// Session refresh interval (15 minutes)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        // Only update if the user actually changed
        const newUser = session?.user ?? null;
        setUser(prevUser => {
          if (prevUser?.id === newUser?.id) return prevUser;
          return newUser;
        });
        setLoading(false);
      }
    });

    // Set up periodic session refresh
    const setupSessionRefresh = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.refreshSession();
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
      }
    };

    refreshInterval = setInterval(setupSessionRefresh, SESSION_REFRESH_INTERVAL);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
        }
        throw error;
      }

      if (data?.user) {
        setUser(data.user);
        router.push('/'); // Redirect to homepage after successful login
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Password validation
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://adhd-app-uzqz.vercel.app/auth/callback',
        },
      });

      if (error) throw error;

      if (data.user) {
        // Send verification email
        const { error: verificationError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });

        if (verificationError) throw verificationError;

        // Redirect to landing page
        router.push('/');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state
      setUser(null);
      
      // Redirect to landing page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 