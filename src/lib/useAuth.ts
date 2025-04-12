import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user || null);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  return user;
};
