import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type CarbonLog = Tables<'carbon_logs'>;

export const useRealtimeCarbonLogs = () => {
  const { user } = useAuth();
  const [carbonLogs, setCarbonLogs] = useState<CarbonLog[]>([]);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('carbon_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching carbon logs:', error);
      } else {
        setCarbonLogs(data || []);
        const total = (data || []).reduce((sum, log) => sum + Number(log.co2_kg), 0);
        setTotalEmissions(total);
      }
      setLoading(false);
    };

    fetchLogs();

    // Set up realtime subscription
    const channel = supabase
      .channel('carbon-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'carbon_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newLog = payload.new as CarbonLog;
          setCarbonLogs((prev) => [newLog, ...prev.slice(0, 99)]);
          setTotalEmissions((prev) => prev + Number(newLog.co2_kg));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { carbonLogs, totalEmissions, loading };
};
