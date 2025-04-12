import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { User } from '@supabase/supabase-js';  

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return user;
};
