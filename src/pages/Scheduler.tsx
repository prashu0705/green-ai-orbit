import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap,
  Wind,
  Leaf,
  ArrowRightLeft,
  Globe,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ForecastCell {
  hour: string;
  value: number;
  isRecommended?: boolean;
}

interface RegionIntensity {
  name: string;
  code: string;
  intensity: number;
  id?: string;
  carbon_factor: number;
}

interface Model {
  id: string;
  name: string;
  region_id: string;
  regions: {
    name: string;
    code: string;
    carbon_factor: number;
  };
}

const Scheduler = () => {
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState<{ day: string; hours: ForecastCell[] }[]>([]);

  // Model Selection State
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Computed State based on selection
  const selectedModel = models.find(m => m.id === selectedModelId);
  const [previewRegionId, setPreviewRegionId] = useState<string>('');

  const [regionIntensities, setRegionIntensities] = useState<RegionIntensity[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state for the "What-If" Scenario
  // We use the Preview Region if set, otherwise fallback to model's current region
  // If no preview set yet, logic below ensures it syncs with model initially
  const activeRegionId = previewRegionId || selectedModel?.region_id || '';
  const activeRegion = regionIntensities.find(r => r.id === activeRegionId);
  const activeRegionCode = activeRegion?.code || 'us-east-1';
  const activeRegionName = activeRegion?.name || 'Unknown';

  const [optimizationOpportunity, setOptimizationOpportunity] = useState<{
    targetRegionId: string;
    targetRegionName: string;
    savings: number;
    isOptimized: boolean; // True if Model Region == Preview Region (and it's good) OR if fully optimized
    mode: 'optimize' | 'simulate'; // 'optimize' = system suggested, 'simulate' = user picked
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  // Sync Preview with Model when Model changes
  useEffect(() => {
    if (selectedModel) {
      setPreviewRegionId(selectedModel.region_id);
    }
  }, [selectedModelId]);

  // Update Forecast & Opportunity whenever Active Region changes
  useEffect(() => {
    generateForecastData(activeRegionCode);

    if (selectedModel && activeRegion) {
      calculateOpportunity(selectedModel, activeRegion);
    }
  }, [activeRegionCode, selectedModel, regionIntensities]);


  const generateForecastData = (regionCode: string) => {
    const days = ['TODAY', 'FRI 28', 'SAT 29', 'SUN 30', 'MON 01'];
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

    // Normalize code for comparison
    const code = (regionCode || 'us-east-1').toLowerCase();

    // Determine base intensity with more dramatic contrast for demo
    let baseIntensity = 450;

    if (code.startsWith('eu-') || code.includes('nordic')) {
      baseIntensity = 40;
    } else if (code.includes('west') || code.includes('central')) {
      baseIntensity = 120;
    } else {
      baseIntensity = 500;
    }

    // 1. Generate Raw Values
    const rawData = days.map((day, dayIndex) => {
      return hours.map((hour, hourIndex) => {
        let value = baseIntensity + (Math.random() * 60 - 30);

        if ((dayIndex === 2 || dayIndex === 3) && hourIndex >= 5) {
          value *= 0.7;
        }

        if (dayIndex < 2 && hourIndex >= 2 && hourIndex <= 4) {
          value *= 1.4;
        }

        return Math.round(value);
      });
    });

    // 2. Find Absolute Minimum
    const allValues = rawData.flat();
    const minVal = Math.min(...allValues);

    // 3. Build Final Data
    const data = days.map((day, dayIndex) => ({
      day,
      hours: hours.map((hour, hourIndex) => {
        const value = rawData[dayIndex][hourIndex];
        return {
          hour,
          value,
          isRecommended: value === minVal, // ONLY the absolute best slot(s)
        };
      }),
    }));

    setForecastData(data);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: regions } = await supabase.from('regions').select('*');
      if (regions) {
        setRegionIntensities(regions.map(r => ({
          name: r.name,
          code: r.code,
          intensity: Math.round(r.carbon_factor * 1000) || 150,
          id: r.id,
          carbon_factor: r.carbon_factor
        })));
      }

      const { data: userModels } = await supabase
        .from('models')
        .select(`
          id, name, region_id,
          regions (name, code, carbon_factor)
        `)
        .eq('user_id', user.id);

      if (userModels && userModels.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setModels(userModels as any);
        if (!selectedModelId) {
          const firstModel = userModels[0];
          setSelectedModelId(firstModel.id);
          setPreviewRegionId(firstModel.region_id); // Init preview
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOpportunity = (model: Model, previewRegion: RegionIntensity) => {
    // Current State
    const currentIntensity = (model.regions?.carbon_factor || 0.5) * 1000;
    const previewIntensity = previewRegion.intensity;

    // Are we looking at the region the model is ALREADY in?
    const isSameRegion = model.region_id === previewRegion.id;

    if (isSameRegion) {
      // If we in same region, check if there's a BETTER one to suggest (Auto-Optimize Mode)
      const sortedRegions = [...regionIntensities].sort((a, b) => a.intensity - b.intensity);
      const bestRegion = sortedRegions[0];

      if (currentIntensity > bestRegion.intensity * 1.2) {
        const savings = Math.round(((currentIntensity - bestRegion.intensity) / currentIntensity) * 100);
        setOptimizationOpportunity({
          targetRegionId: bestRegion.id || '',
          targetRegionName: bestRegion.name,
          savings,
          isOptimized: false,
          mode: 'optimize'
        });
      } else {
        setOptimizationOpportunity({
          targetRegionId: model.region_id,
          targetRegionName: model.regions?.name || 'Unknown',
          savings: 0,
          isOptimized: true,
          mode: 'optimize'
        });
      }
    } else {
      // Simulation Mode: User picked a different region
      // Calculate savings relative to current
      let savings = 0;
      if (currentIntensity > previewIntensity) {
        savings = Math.round(((currentIntensity - previewIntensity) / currentIntensity) * 100);
        setOptimizationOpportunity({
          targetRegionId: previewRegion.id || '',
          targetRegionName: previewRegion.name,
          savings,
          isOptimized: false, // "Not optimized" means "Action available to take"
          mode: 'simulate'
        });
      } else {
        // New region is worse or same
        setOptimizationOpportunity({
          targetRegionId: previewRegion.id || '',
          targetRegionName: previewRegion.name,
          savings: 0, // Negative savings?
          isOptimized: true, // No action recommended (don't move to worse place)
          mode: 'simulate'
        });
      }
    }
  };

  const getCellColor = (value: number) => {
    if (value < 100) return 'bg-green-100 text-green-800 border-green-200';
    if (value < 300) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleShiftWorkload = async () => {
    if (!optimizationOpportunity || !user || !selectedModel) return;
    // Allow shifting even if "isOptimized" is true IF we are in simulation mode (User forcing a move?)
    // But logically we track "action available" via !isOptimized for the button state usually.
    // Let's rely on the button enable state.

    try {
      toast.info(`Moving ${selectedModel.name} to ${optimizationOpportunity.targetRegionName}...`);

      const { error } = await supabase
        .from('models')
        .update({ region_id: optimizationOpportunity.targetRegionId })
        .eq('id', selectedModel.id);

      if (error) throw error;

      toast.success(`Success! Workload shifted to ${optimizationOpportunity.targetRegionName}.`);

      // Update local state and Sync Preview to the NEW region (stick to it)
      const newRegionId = optimizationOpportunity.targetRegionId;
      setModels(prev => prev.map(m => {
        if (m.id === selectedModel.id) {
          return {
            ...m,
            region_id: newRegionId,
            regions: {
              ...m.regions,
              name: optimizationOpportunity.targetRegionName,
              code: 'updated',
              carbon_factor: 0.1
            }
          };
        }
        return m;
      }));
      setPreviewRegionId(newRegionId); // Update preview to match new reality

      setTimeout(fetchData, 1000);

    } catch (error) {
      console.error('Error shifting workload:', error);
      toast.error('Failed to shift workload');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
          {/* ... Header Content ... */}
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full hidden md:block">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Scheduler & Optimization</h2>
              <p className="text-sm text-muted-foreground">Optimize execution windows and regions</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-medium whitespace-nowrap">Model:</span>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
                {models.length === 0 && <SelectItem value="none" disabled>No active models</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Forecast Grid (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-sm border-0 bg-transparent sm:bg-card sm:border sm:shadow-card">
              <CardHeader className="pb-4 px-0 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      Carbon Intensity Forecast
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Region: <span className="font-medium text-primary">{activeRegionName}</span>
                    </p>
                  </div>

                  {/* Legend - Minimalist */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Low (&lt;150g)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-muted-foreground">Med</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-muted-foreground">High (&gt;400g)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {/* Horizontal Region Selector Bar */}
                <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {regionIntensities.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setPreviewRegionId(r.id || '')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeRegionId === r.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>

                {loading && models.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-2 border-spacing-x-2 sm:border-spacing-x-4">
                      <thead>
                        <tr>
                          <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2 w-20">
                            TIME (UTC)
                          </th>
                          {forecastData.map(d => (
                            <th key={d.day} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2">
                              {d.day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hour, hourIndex) => (
                          <tr key={hour}>
                            <td className="text-xs font-medium text-muted-foreground py-2">{hour}</td>
                            {forecastData.map((day, dayIndex) => {
                              const cell = day.hours[hourIndex];
                              // Custom Color Logic for "Pills"
                              let cellClass = "bg-rose-50 text-rose-600 border border-transparent"; // High default
                              if (cell.value < 150) cellClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                              else if (cell.value < 400) cellClass = "bg-amber-50 text-amber-700 border border-amber-100";

                              if (cell.isRecommended) {
                                cellClass = "bg-emerald-100 text-emerald-900 border-2 border-emerald-500 shadow-sm transform scale-105";
                              }

                              return (
                                <td key={`${day.day}-${hour}`}>
                                  <div className={`relative h-10 sm:h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${cellClass}`}>
                                    {cell.value}g
                                    {cell.isRecommended && (
                                      <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                                        Rec
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Insights & Actions (Span 4) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. Recommended Slot Card (Green / Gradient) */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-[#0f766e] to-[#047857] text-white overflow-hidden relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none" />

              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-2 mb-4 text-emerald-100">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Recommended Slot</span>
                </div>

                <h3 className="text-3xl font-bold mb-1">
                  Tomorrow, 18:00 <span className="text-lg font-medium opacity-80">UTC</span>
                </h3>

                <p className="text-emerald-50 text-sm leading-relaxed mb-6 opacity-90">
                  Shift workload to <span className="font-semibold text-white">{optimizationOpportunity?.targetRegionName || 'us-west-2'}</span> to reduce carbon intensity by <span className="font-bold text-white">{optimizationOpportunity?.savings || 85}%</span> compared to current runtime.
                </p>

                <div className="flex gap-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1.5 backdrop-blur-sm">
                    <Wind className="h-3.5 w-3.5 mr-1.5" />
                    Wind: High
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1.5 backdrop-blur-sm">
                    <Leaf className="h-3.5 w-3.5 mr-1.5" />
                    80g CO₂/kWh
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 2. Regional Intensity Map (Placeholder Visualization) */}
            <Card className="shadow-card border-border/60">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Regional Intensity</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-auto p-0 hover:bg-transparent">View Global</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/30 rounded-xl p-4 h-40 flex items-center justify-center relative overflow-hidden">
                  {/* Abstract Map Blobs */}
                  <div className="absolute w-16 h-16 bg-emerald-200/50 rounded-full top-4 left-8 blur-xl" />
                  <div className="absolute w-20 h-20 bg-rose-200/50 rounded-full bottom-2 right-8 blur-xl" />

                  <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                    {/* Mini Intensity Bars */}
                    {regionIntensities.slice(0, 4).map(r => (
                      <div key={r.id} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>{r.code}</span>
                          <span>{r.intensity}g</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.intensity < 150 ? 'bg-emerald-500' : r.intensity < 300 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min((r.intensity / 600) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-4 text-[10px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &lt;100g</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 100-400g</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &gt;400g</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Optimization Action */}
            <Card className="shadow-card border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Optimization Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Move current workload to lowest carbon region immediately.
                </p>
                <div className="flex items-end justify-between mb-4">
                  {optimizationOpportunity && !optimizationOpportunity.isOptimized && (
                    <div className="text-right w-full">
                      <span className="text-2xl font-bold text-emerald-600">-{optimizationOpportunity.savings}%</span>
                      <span className="text-xs text-muted-foreground ml-1">CO₂ SAVED</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-11"
                  onClick={handleShiftWorkload}
                  disabled={!optimizationOpportunity || optimizationOpportunity.isOptimized}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {optimizationOpportunity && !optimizationOpportunity.isOptimized
                    ? `Shift Workload to ${optimizationOpportunity.targetRegionName.split(' ')[0]}`
                    : 'Fully Optimized'}
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Scheduler;
