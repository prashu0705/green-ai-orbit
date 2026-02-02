import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type EnergySource = Tables<'energy_sources'>;

export const useRealtimeEnergySources = () => {
  const { user } = useAuth();
  const [energySources, setEnergySources] = useState<EnergySource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchSources = async () => {
      const { data, error } = await supabase
        .from('energy_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching energy sources:', error);
      } else {
        setEnergySources(data || []);
      }
      setLoading(false);
    };

    fetchSources();

    // Set up realtime subscription
    const channel = supabase
      .channel('energy-sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'energy_sources',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEnergySources((prev) => [payload.new as EnergySource, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEnergySources((prev) =>
              prev.map((s) => (s.id === (payload.new as EnergySource).id ? (payload.new as EnergySource) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setEnergySources((prev) => prev.filter((s) => s.id !== (payload.old as EnergySource).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate derived values
  const renewablePercentage = energySources
    .filter(s => s.is_renewable)
    .reduce((sum, s) => sum + s.percentage, 0);

  const formattedSources = energySources.map((s, i) => ({
    name: s.source_name,
    value: s.percentage,
    color: s.is_renewable ? (i === 0 ? '#10b981' : '#14b8a6') : '#6b7280',
  }));

  return { energySources, formattedSources, renewablePercentage, loading };
};
