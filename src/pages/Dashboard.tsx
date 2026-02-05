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
  Lightbulb,
  Shield,
  Bot,
  CheckCircle,
  CloudLightning,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';


interface DashboardStats {
  totalCO2: number;
  co2Change: number;
  targetCO2: number;
  efficiencyScore: number;
  renewablePercentage: number;
  activeWorkflows: number;
  costSavings: number;
  activePolicies: string[];
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
    activeWorkflows: 0,
    costSavings: 0,
    activePolicies: [],
    energySources: [],
  });
  const [loading, setLoading] = useState(true);
  const [realtimeChartData, setRealtimeChartData] = useState([
    { time: '00:00', co2: 320 }, { time: '04:00', co2: 280 },
    { time: '08:00', co2: 450 }, { time: '12:00', co2: 380 },
    { time: '16:00', co2: 410 }, { time: '20:00', co2: 340 },
    { time: '24:00', co2: 290 }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch models to calculate total CO2
        const { data: models } = await supabase
          .from('models')
          .select('co2_emissions, efficiency_score, status')
          .eq('user_id', user.id);

        if (models && models.length > 0) {
          const totalCO2 = models.reduce((sum, m) => sum + Number(m.co2_emissions || 0), 0);
          const avgEfficiency = models.reduce((sum, m) => sum + Number(m.efficiency_score || 0), 0) / models.length;
          // Filter only active/running models
          const activeCount = models.filter((m: any) => m.status === 'active' || m.status === 'training').length;

          // Calculate estimated savings based on efficiency score vs baseline
          // Baseline cost assumed $0.5/hr/GPU. Savings = (efficiency/100) * total_gpu * 730hrs * $0.5
          const totalGPU = models.reduce((sum, m) => sum + (m.gpu_count || 1), 0);
          const estimatedSavings = Math.round(totalGPU * 365 * (avgEfficiency / 100));

          // Fetch policies from user metadata
          const automation = user.user_metadata?.automation || { autoSleep: true, greenOnly: false, rightSizing: true };
          const policies = [];
          if (automation.autoSleep) policies.push('Auto-Sleep Idle Models');
          if (automation.greenOnly) policies.push('Green Region Only');
          if (automation.rightSizing) policies.push('Right-sizing Assistant');

          setStats(prev => ({
            ...prev,
            totalCO2: totalCO2,
            efficiencyScore: avgEfficiency > 0 ? Math.round(avgEfficiency) : 0,
            activeWorkflows: activeCount,
            costSavings: estimatedSavings,
            activePolicies: policies
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

  // Real-time chart simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeChartData(prev => {
        const lastTime = parseInt(prev[prev.length - 1].time.split(':')[0]);
        const nextTime = (lastTime + 1) % 24;
        const nextTimeStr = `${nextTime.toString().padStart(2, '0')}:00`;
        const newCo2 = 300 + Math.random() * 100;

        return [...prev.slice(1), { time: nextTimeStr, co2: Math.round(newCo2) }];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const dynamicRecommendations = [
    stats.activeWorkflows > 0 && stats.efficiencyScore < 75 ? {
      icon: Gauge,
      title: 'Right-size Models',
      description: 'Your efficiency is below 75%. Consider downsizing idle instances.',
    } : null,
    stats.renewablePercentage < 50 ? {
      icon: Globe,
      title: 'Switch Region',
      description: 'Renewable usage is low. Move workloads to eu-north-1.',
    } : null,
    {
      icon: Clock,
      title: 'Schedule Training',
      description: 'Shift training to 02:00 AM for wind energy peak.',
    },
    {
      icon: Zap,
      title: 'Enable Green Mode',
      description: 'Auto-pause workloads when grid carbon intensity is high.',
    },
    {
      icon: CheckCircle,
      title: 'Review Policies',
      description: 'Check your automation settings to maximize savings.',
    }
  ].filter(Boolean).slice(0, 3);

  return (
    <AppLayout>

      <div className="space-y-6 animate-fade-in relative z-10">

        {/* HERO ROW: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Total CO2 */}
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Carbon Emission</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalCO2.toFixed(3)}t</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                  <TrendingDown className="h-3 w-3" />
                  <span>{stats.co2Change}% vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <CloudLightning className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* 2. Efficiency Score */}
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{stats.efficiencyScore}/100</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <span>Top 5% of Organization</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* 3. Renewable Usage */}
          {/* 3. Active Workflows (Repl. Renewable Energy) */}
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeWorkflows}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-blue-500 font-medium">
                  <Activity className="h-3 w-3" />
                  <span>Running Now</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* 4. Cost Savings (Simulated) */}
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Cost Savings</p>
                <h3 className="text-2xl font-bold mt-1">${stats.costSavings.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                  <ArrowRight className="h-3 w-3 rotate-45" />
                  <span>Projected / Year</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN (2/3): Charts & Trends */}
          <div className="lg:col-span-2 space-y-6">

            {/* Emissions Trend Chart */}
            <Card className="bg-card border-border/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Emission Trends</h3>
                  <p className="text-sm text-muted-foreground">Real-time carbon intensity over 24h</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </Badge>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realtimeChartData}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCo2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Active Policies */}
            <Card className="bg-card border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Active Policies</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Automated Governance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.activePolicies.length > 0 ? (
                    stats.activePolicies.map((policy, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">{policy}</p>
                        </div>
                        <Activity className="h-3 w-3 text-muted-foreground animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">No active policies</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (1/3): Energy Mix & Actions */}
          <div className="space-y-6">

            {/* Energy Mix */}
            <Card className="bg-card border-border/50 shadow-sm h-[320px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Energy Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="relative h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.energySources.length > 0 ? stats.energySources : [{ name: 'No Data', value: 100, color: '#e5e7eb' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={6}
                        stroke="none"
                      >
                        {(stats.energySources.length > 0 ? stats.energySources : [{ name: 'No Data', value: 100, color: '#e5e7eb' }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{stats.renewablePercentage}%</span>
                    <span className="text-xs text-muted-foreground">Green</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  {stats.energySources.map((source, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-xs font-medium text-muted-foreground">{source.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Actions */}
            <Card className="bg-card border-border/50 shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dynamicRecommendations.map((tip: any, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50 group">
                    <div className="mt-1 p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 text-primary">
                      <tip.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1 group-hover:text-primary transition-colors">{tip.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
