import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();
  const [isBarber, setIsBarber] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBarber(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const roles = data?.map(r => r.role) || [];
        setIsBarber(roles.includes('barber'));
        setIsAdmin(roles.includes('admin'));
      } catch (error) {
        console.error('Error checking roles:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRoles();
  }, [user]);

  return { isBarber, isAdmin, loading };
}
