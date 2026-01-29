import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, Zap, Leaf, Cpu, TrendingUp, AlertCircle } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'training';
  co2_emissions: number;
  energy_kwh: number;
  gpu_hours: number;
  gpu_count: number;
  efficiency_score: number | null;
  version: string | null;
  region_id: string;
}

const ModelComparison = () => {
  const { user } = useAuth();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models-comparison', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!user,
  });

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : prev.length < 4 
          ? [...prev, modelId]
          : prev
    );
  };

  const selectedModelsData = models.filter(m => selectedModels.includes(m.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active/20 text-green-700 border-status-active';
      case 'idle': return 'bg-status-idle/20 text-yellow-700 border-status-idle';
      case 'training': return 'bg-status-training/20 text-blue-700 border-status-training';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const comparisonBarData = selectedModelsData.map(model => ({
    name: model.name.length > 15 ? model.name.slice(0, 15) + '...' : model.name,
    'CO₂ (kg)': model.co2_emissions,
    'Energy (kWh)': model.energy_kwh,
    'GPU Hours': model.gpu_hours,
  }));

  const radarData = selectedModelsData.length > 0 ? [
    { metric: 'Efficiency', ...Object.fromEntries(selectedModelsData.map(m => [m.name.slice(0, 10), m.efficiency_score || 0])) },
    { metric: 'Low CO₂', ...Object.fromEntries(selectedModelsData.map(m => [m.name.slice(0, 10), Math.max(0, 100 - m.co2_emissions * 10)])) },
    { metric: 'Energy Opt', ...Object.fromEntries(selectedModelsData.map(m => [m.name.slice(0, 10), Math.max(0, 100 - m.energy_kwh * 5)])) },
    { metric: 'GPU Util', ...Object.fromEntries(selectedModelsData.map(m => [m.name.slice(0, 10), Math.min(100, m.gpu_hours / m.gpu_count * 10)])) },
  ] : [];

  const radarColors = ['hsl(var(--primary))', 'hsl(var(--eco-green))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const getBestModel = (metric: keyof Model) => {
    if (selectedModelsData.length === 0) return null;
    
    if (metric === 'efficiency_score') {
      return selectedModelsData.reduce((best, current) => 
        (current.efficiency_score || 0) > (best.efficiency_score || 0) ? current : best
      );
    }
    
    return selectedModelsData.reduce((best, current) => {
      const currentVal = current[metric] as number;
      const bestVal = best[metric] as number;
      return currentVal < bestVal ? current : best;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <GitCompare className="h-8 w-8 text-primary" />
              Model Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare emissions, efficiency, and performance across your AI models
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {selectedModels.length}/4 selected
          </Badge>
        </div>

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Select Models to Compare
            </CardTitle>
            <CardDescription>
              Choose up to 4 models to compare side-by-side
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No models found. Create some models first!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map(model => (
                  <div
                    key={model.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedModels.includes(model.id)
                        ? 'border-primary bg-primary/5 shadow-eco'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleModelSelection(model.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedModels.includes(model.id)}
                        disabled={!selectedModels.includes(model.id) && selectedModels.length >= 4}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{model.name}</span>
                          <Badge className={`text-xs ${getStatusColor(model.status)}`}>
                            {model.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {model.co2_emissions.toFixed(2)} kg CO₂ • {model.energy_kwh.toFixed(1)} kWh
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedModels.length >= 2 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Leaf className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lowest CO₂</p>
                      <p className="font-semibold truncate">
                        {getBestModel('co2_emissions')?.name || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Efficient</p>
                      <p className="font-semibold truncate">
                        {getBestModel('energy_kwh')?.name || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fewest GPU Hours</p>
                      <p className="font-semibold truncate">
                        {getBestModel('gpu_hours')?.name || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Overall</p>
                      <p className="font-semibold truncate">
                        {getBestModel('efficiency_score')?.name || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Comparison</CardTitle>
                  <CardDescription>CO₂ emissions, energy, and GPU hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="CO₂ (kg)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Energy (kWh)" fill="hsl(var(--eco-green))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="GPU Hours" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>Multi-dimensional efficiency analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      {selectedModelsData.map((model, idx) => (
                        <Radar
                          key={model.id}
                          name={model.name.slice(0, 10)}
                          dataKey={model.name.slice(0, 10)}
                          stroke={radarColors[idx]}
                          fill={radarColors[idx]}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
                <CardDescription>Side-by-side metrics for selected models</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {selectedModelsData.map(model => (
                        <TableHead key={model.id}>{model.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>
                          <Badge className={getStatusColor(model.status)}>{model.status}</Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">CO₂ Emissions</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>{model.co2_emissions.toFixed(2)} kg</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Energy Usage</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>{model.energy_kwh.toFixed(1)} kWh</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">GPU Hours</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>{model.gpu_hours.toFixed(1)} hrs</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">GPU Count</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>{model.gpu_count}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Efficiency Score</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>
                          <div className="flex items-center gap-2">
                            <Progress value={model.efficiency_score || 0} className="w-16 h-2" />
                            <span>{model.efficiency_score || 0}%</span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Version</TableCell>
                      {selectedModelsData.map(model => (
                        <TableCell key={model.id}>{model.version || 'N/A'}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {selectedModels.length < 2 && selectedModels.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select at least 2 models to start comparing</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ModelComparison;
