import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingDown,
  Leaf,
  Zap,
  Sun,
  Wind,
  Building2,
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
  const [stats, setStats] = useState<DashboardStats>({
    totalCO2: 0,
    co2Change: 0,
    targetCO2: 0,
    efficiencyScore: 0,
    renewablePercentage: 0,
    energySources: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch models to calculate total CO2
        const { data: models } = await supabase
          .from('models')
          .select('co2_emissions, efficiency_score')
          .eq('user_id', user.id);

        if (models && models.length > 0) {
          const totalCO2 = models.reduce((sum, m) => sum + Number(m.co2_emissions || 0), 0);
          const avgEfficiency = models.reduce((sum, m) => sum + Number(m.efficiency_score || 0), 0) / models.length;

          setStats(prev => ({
            ...prev,
            totalCO2: totalCO2,
            efficiencyScore: avgEfficiency > 0 ? Math.round(avgEfficiency) : 0,
          }));
        }

        // Fetch models with region data to calculate Energy Mix
        const { data: modelsWithRegion } = await supabase
          .from('models')
          .select(`
            *,
            regions (name, code, renewable_percentage)
          `)
          .eq('user_id', user.id);

        if (modelsWithRegion && modelsWithRegion.length > 0) {
          // Group by "Clean" vs "Fossil" roughly based on region
          let renewableEnergy = 0;
          let fossilEnergy = 0;

          modelsWithRegion.forEach(m => {
            const renewablePercent = m.regions?.renewable_percentage || 25;
            const energy = Number(m.energy_kwh) || 100; // fallback to 100kW if data missing
            renewableEnergy += energy * (renewablePercent / 100);
            fossilEnergy += energy * ((100 - renewablePercent) / 100);
          });

          const totalCalculated = renewableEnergy + fossilEnergy;
          const formattedSources = [
            { name: 'Renewables (Hydro/Wind)', value: Math.round((renewableEnergy / totalCalculated) * 100), color: '#10b981' }, // Green
            { name: 'Fossil Fuels (Grid)', value: Math.round((fossilEnergy / totalCalculated) * 100), color: '#6b7280' },   // Gray
          ].filter(s => s.value > 0);

          setStats(prev => ({
            ...prev,
            energySources: formattedSources,
            renewablePercentage: Math.round((renewableEnergy / totalCalculated) * 100),
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Rightsizing Logic
  const instanceLevels = ['g5.4xlarge', 'g5.2xlarge', 'g5.xlarge', 'g4dn.xlarge'];
  const [currentInstanceIdx, setCurrentInstanceIdx] = useState(0);

  const handleRightsizingClick = () => {
    if (currentInstanceIdx < instanceLevels.length - 1) {
      setCurrentInstanceIdx(prev => prev + 1);
      // Simulate API update
      toast.success(`Downgraded to ${instanceLevels[currentInstanceIdx + 1]}`);
    }
  };

  const isOptimal = currentInstanceIdx === instanceLevels.length - 1;
  const currentInstance = instanceLevels[currentInstanceIdx];

  const optimizationTips = [
    {
      icon: Globe,
      title: 'Switch Region',
      description: 'Region eu-north-1 has 40% lower carbon intensity right now.',
      highlight: 'eu-north-1',
      action: null
    },
    {
      icon: Clock,
      title: 'Schedule Training',
      description: 'Shift training job #AF82 to 02:00 AM for wind energy peak.',
      action: null
    },
    {
      icon: Gauge,
      title: isOptimal ? 'Rightsized (Optimal)' : 'Right-size Model',
      description: isOptimal
        ? `Instance ${currentInstance} is running at optimal efficiency.`
        : `Instance ${currentInstance} is underutilized. Click to downgrade.`,
      highlight: currentInstance,
      action: !isOptimal ? handleRightsizingClick : null,
      isOptimal: isOptimal
    },
  ];

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
                  <span className="text-5xl font-bold text-foreground">{stats.totalCO2.toFixed(3)}</span>
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
                      data={stats.energySources.length > 0 ? stats.energySources : [{ name: 'No Data', value: 100, color: '#e5e7eb' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(stats.energySources.length > 0 ? stats.energySources : [{ name: 'No Data', value: 100, color: '#e5e7eb' }]).map((entry, index) => (
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
                {stats.energySources.length > 0 ? (
                  stats.energySources.map((source, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                        <span className="text-sm">{source.name}</span>
                      </div>
                      <span className="text-sm font-medium">{source.value}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">No energy sources tracked yet</div>
                )}
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
                <div
                  key={i}
                  className={`flex gap-3 p-2 rounded-lg transition-colors ${tip.action ? 'cursor-pointer hover:bg-muted/50 active:scale-[0.98]' : ''}`}
                  onClick={() => tip.action && tip.action()}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    // @ts-ignore
                    tip.isOptimal ? 'bg-green-100 text-green-600' : 'bg-secondary text-primary'
                    }`}>
                    <tip.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      // @ts-ignore
                      tip.isOptimal ? 'text-green-700' : 'text-foreground'
                      }`}>
                      {tip.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {tip.description}
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
