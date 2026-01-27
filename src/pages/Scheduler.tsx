import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Zap,
  Wind,
  Leaf,
  ArrowRightLeft,
  Globe,
  Clock
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
}

const Scheduler = () => {
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState<{ day: string; hours: ForecastCell[] }[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [recommendedSlot, setRecommendedSlot] = useState({
    time: 'Tomorrow, 18:00',
    region: 'us-west-2 (Oregon)',
    savings: 85,
    tags: ['Wind: High', '80g CO₂/kWh'],
  });
  const [regionIntensities, setRegionIntensities] = useState<RegionIntensity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateForecastData();
    fetchRegionIntensities();
  }, []);

  const generateForecastData = () => {
    const days = ['TODAY', 'FRI 28', 'SAT 29', 'SUN 30', 'MON 01'];
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    
    const data = days.map((day, dayIndex) => ({
      day,
      hours: hours.map((hour, hourIndex) => {
        // Generate realistic carbon intensity values
        let baseValue = 200 + Math.random() * 300;
        
        // Lower values for weekend nights (renewable peak)
        if ((dayIndex === 2 || dayIndex === 3) && hourIndex >= 5) {
          baseValue = 80 + Math.random() * 100;
        }
        
        // Peak values during weekday afternoons
        if (dayIndex < 2 && hourIndex >= 2 && hourIndex <= 4) {
          baseValue = 400 + Math.random() * 150;
        }

        const value = Math.round(baseValue);
        
        return {
          hour,
          value,
          isRecommended: day === 'FRI 28' && hour === '18:00',
        };
      }),
    }));

    setForecastData(data);
    setLoading(false);
  };

  const fetchRegionIntensities = async () => {
    const { data } = await supabase.from('regions').select('name, code, carbon_factor');
    
    if (data) {
      setRegionIntensities(data.map(r => ({
        name: r.name,
        code: r.code,
        intensity: Math.round(r.carbon_factor * 1000), // Convert to g/kWh
      })));
    }
  };

  const getCellColor = (value: number) => {
    if (value < 150) return 'bg-green-100 text-green-800 border-green-200';
    if (value < 400) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleShiftWorkload = async () => {
    if (!user) return;

    try {
      // Get user's first model
      const { data: models } = await supabase
        .from('models')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (models && models.length > 0) {
        // Get Oregon region
        const { data: regions } = await supabase
          .from('regions')
          .select('id')
          .eq('code', 'us-west-2')
          .single();

        if (regions) {
          // Update model region
          await supabase
            .from('models')
            .update({ region_id: regions.id })
            .eq('id', models[0].id);

          toast.success('Workload shifted to Oregon! Estimated savings: 1.4t CO₂');
        }
      } else {
        toast.info('Add a model first to shift workloads');
      }
    } catch (error) {
      console.error('Error shifting workload:', error);
      toast.error('Failed to shift workload');
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carbon Intensity Forecast */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Carbon Intensity Forecast</CardTitle>
                <p className="text-sm text-muted-foreground">Region: {selectedRegion} (N. Virginia)</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Low (&lt;150g)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Med</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>High (&gt;400g)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 pr-4">
                        Time (UTC)
                      </th>
                      {forecastData.map(d => (
                        <th key={d.day} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 px-2">
                          {d.day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hour, hourIndex) => (
                      <tr key={hour}>
                        <td className="text-sm text-muted-foreground py-1 pr-4">{hour}</td>
                        {forecastData.map((day, dayIndex) => {
                          const cell = day.hours[hourIndex];
                          return (
                            <td key={`${day.day}-${hour}`} className="py-1 px-1">
                              <div
                                className={`relative rounded-lg px-3 py-2 text-center text-sm font-medium border ${getCellColor(cell.value)} ${
                                  cell.isRecommended ? 'ring-2 ring-primary ring-offset-2' : ''
                                }`}
                              >
                                {cell.value}g
                                {cell.isRecommended && (
                                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                                    Rec
                                  </span>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recommended Slot */}
          <Card className="shadow-card gradient-eco text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-white/80">
                <Zap className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Recommended Slot</span>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="text-3xl font-bold mb-2">{recommendedSlot.time} <span className="text-lg font-normal opacity-80">UTC</span></h2>
              <p className="text-white/80 mb-4">
                Shift workload to <span className="font-medium text-white">{recommendedSlot.region}</span> to reduce carbon 
                intensity by <span className="font-medium text-white">{recommendedSlot.savings}%</span> compared to current runtime.
              </p>
              <div className="flex gap-2 mb-4">
                {recommendedSlot.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/20 text-white border-0">
                    {tag.includes('Wind') && <Wind className="h-3 w-3 mr-1" />}
                    {tag.includes('CO₂') && <Leaf className="h-3 w-3 mr-1" />}
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regional Intensity */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Regional Intensity</CardTitle>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                View Global
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative h-40 bg-muted rounded-lg mb-4 flex items-center justify-center">
                <Globe className="h-20 w-20 text-muted-foreground/20" />
                {/* Simulated map dots */}
                <div className="absolute top-8 left-12 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute top-12 right-16 w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <div className="absolute bottom-12 left-20 w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>&lt; 100g</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>100-400g</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>&gt; 400g</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Action */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Optimization Action</CardTitle>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">-1.4t</span>
                  <p className="text-xs text-muted-foreground">CO₂ SAVED</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Move current workload to lowest carbon region immediately.
              </p>
              <Button className="w-full" onClick={handleShiftWorkload}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Shift Workload to Oregon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Scheduler;
