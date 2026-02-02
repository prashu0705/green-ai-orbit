import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeModels } from '@/hooks/useRealtimeModels';
import { 
  TrendingDown, 
  Leaf, 
  Zap, 
  Globe,
  Clock,
  Gauge,
  Lightbulb
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalCO2: number;
  co2Change: number;
  targetCO2: number;
  efficiencyScore: number;
  renewablePercentage: number;
  energySources: { name: string; value: number; color: string }[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { models, loading: modelsLoading } = useRealtimeModels();
  const [stats, setStats] = useState<DashboardStats>({
    totalCO2: 0,
    co2Change: 0,
    targetCO2: 1.0,
    efficiencyScore: 0,
    renewablePercentage: 0,
    energySources: [],
  });
  const [sourcesLoading, setSourcesLoading] = useState(true);

  // Calculate stats from realtime models
  useEffect(() => {
    if (models.length > 0) {
      const totalCO2 = models.reduce((sum, m) => sum + Number(m.co2_emissions || 0), 0);
      const avgEfficiency = models.reduce((sum, m) => sum + Number(m.efficiency_score || 0), 0) / models.length;
      
      setStats(prev => ({
        ...prev,
        totalCO2: totalCO2,
        efficiencyScore: Math.round(avgEfficiency),
      }));
    }
  }, [models]);

  // Fetch energy sources only
  useEffect(() => {
    const fetchEnergySources = async () => {
      if (!user) return;

      try {
        const { data: sources } = await supabase
          .from('energy_sources')
          .select('*')
          .eq('user_id', user.id);

        if (sources && sources.length > 0) {
          const formattedSources = sources.map((s, i) => ({
            name: s.source_name,
            value: s.percentage,
            color: s.is_renewable ? (i === 0 ? '#10b981' : '#14b8a6') : '#6b7280',
          }));
          const renewablePercent = sources
            .filter(s => s.is_renewable)
            .reduce((sum, s) => sum + s.percentage, 0);
          
          setStats(prev => ({
            ...prev,
            energySources: formattedSources,
            renewablePercentage: renewablePercent,
          }));
        }
      } catch (error) {
        console.error('Error fetching energy sources:', error);
      } finally {
        setSourcesLoading(false);
      }
    };

    fetchEnergySources();
  }, [user]);

  const optimizationTips = [
    {
      icon: Globe,
      title: 'Switch Region',
      description: 'Region eu-north-1 has 40% lower carbon intensity right now.',
      highlight: 'eu-north-1',
    },
    {
      icon: Clock,
      title: 'Schedule Training',
      description: 'Shift training job #AF82 to 02:00 AM for wind energy peak.',
    },
    {
      icon: Gauge,
      title: 'Rightsizing',
      description: 'Instance g5.xlarge is underutilized (15%). Downgrade advised.',
    },
  ];

  const loading = modelsLoading || sourcesLoading;
  const hasData = models.length > 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!hasData) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Leaf className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">No Models Yet</h2>
          <p className="text-muted-foreground mb-4">Add your first AI model to start tracking carbon emissions.</p>
          <a 
            href="/models" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Add Your First Model
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Footprint Card */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Carbon Footprint
              </CardTitle>
              <p className="text-xs text-muted-foreground">Real-time emission tracking</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
              </svg>
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.totalCO2 / stats.targetCO2) * 0.7 * 502} 502`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-foreground">{stats.totalCO2}</span>
                  <span className="text-lg text-muted-foreground">t CO₂e</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-eco-green">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">{stats.co2Change}% vs last month</span>
              </div>
              <span className="text-sm text-muted-foreground">Target: {stats.targetCO2}t</span>
            </div>
          </CardContent>
        </Card>

        {/* Energy Mix Card */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Energy Mix
              </CardTitle>
              <p className="text-xs text-muted-foreground">Power sources for current workloads</p>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-2 h-2 rounded-full bg-muted" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="relative">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={stats.energySources}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.energySources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {stats.energySources.map((source, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-sm">{source.name}</span>
                    </div>
                    <span className="text-sm font-medium">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-primary">
                <Leaf className="h-4 w-4" />
                <span className="text-sm font-medium">{stats.renewablePercentage}% Renewable</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Score Card */}
        <Card className="gradient-eco text-white shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Efficiency Score
              </CardTitle>
              <p className="text-xs text-white/60">Compute resource optimization</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="py-4">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold">{stats.efficiencyScore}</span>
                <span className="text-2xl text-white/60">/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <span className="text-sm text-white/80">Excellent Rating</span>
              <span className="text-sm text-white/60">Top 5% of users</span>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Tips Card */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Optimization Tips
              </CardTitle>
              <p className="text-xs text-muted-foreground">Reduce impact & costs</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-eco-yellow/20 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-eco-yellow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationTips.map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <tip.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {tip.description.split(tip.highlight || '').map((part, j) => (
                        <span key={j}>
                          {part}
                          {tip.highlight && j === 0 && (
                            <span className="text-primary font-medium">{tip.highlight}</span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
