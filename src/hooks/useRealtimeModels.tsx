import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Model = Tables<'models'>;

export const useRealtimeModels = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching models:', error);
      } else {
        setModels(data || []);
      }
      setLoading(false);
    };

    fetchModels();

    // Set up realtime subscription
    const channel = supabase
      .channel('models-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'models',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setModels((prev) => [payload.new as Model, ...prev]);
            toast.info(`New model added: ${(payload.new as Model).name}`);
          } else if (payload.eventType === 'UPDATE') {
            setModels((prev) =>
              prev.map((m) => (m.id === (payload.new as Model).id ? (payload.new as Model) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setModels((prev) => prev.filter((m) => m.id !== (payload.old as Model).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { models, loading };
};
