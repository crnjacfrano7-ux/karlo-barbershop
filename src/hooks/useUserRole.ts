import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [isBarber, setIsBarber] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking roles:', error);
        setIsBarber(false);
        setIsAdmin(false);
      } else {
        const roles = data?.map(r => r.role) || [];
        console.log('useUserRole: fetched roles for user', userId, roles);
        setIsBarber(roles.includes('barber'));
        setIsAdmin(roles.includes('admin'));
      }
    } catch (error) {
      console.error('Error checking roles:', error);
      setIsBarber(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsBarber(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    checkRoles(user.id);
  }, [user, authLoading, checkRoles]);

  return { isBarber, isAdmin, loading };
}
