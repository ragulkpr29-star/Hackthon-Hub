'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  // Keep the same Supabase client instance across renders.
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch profile:', error);
        return null;
      }

      return data as Profile | null;
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (user) {
          const profile = await fetchProfile(user.id);

          if (!mounted) return;

          setState({
            user,
            profile,
            loading: false,
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);

        if (!mounted) return;

        setState({
          user: null,
          profile: null,
          loading: false,
        });
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);

          if (!mounted) return;

          setState({
            user: session.user,
            profile,
            loading: false,
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
          });
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return state;
}