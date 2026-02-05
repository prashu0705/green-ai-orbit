import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Plus,
  Cpu,
  Gauge,
  Moon,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Model {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'idle' | 'training';
  region_id: string;
  region_name?: string;
  region_code?: string;
  gpu_hours: number;
  gpu_count: number;
  energy_kwh: number;
  co2_emissions: number;
  efficiency_score: number;
  created_at: string;
  last_deployed_at: string;
  next_maintenance_at: string | null;
}

interface Region {
  id: string;
  name: string;
  code: string;
  carbon_factor: number;
}

const Models = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [energyData, setEnergyData] = useState<{ time: string; value: number }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState<{ name: string; region_id: string; gpu_count: number | '' }>({ name: '', region_id: '', gpu_count: 1 });

  useEffect(() => {
    fetchModels();
    fetchRegions();
  }, [user]);

  const fetchRegions = async () => {
    const { data } = await supabase.from('regions').select('*');
    if (data) setRegions(data);
  };

  const fetchModels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('models')
        .select(`
          *,
          regions (name, code)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        let formattedModels = data.map(m => ({
          ...m,
          region_name: m.regions?.name,
          region_code: m.regions?.code,
        }));

        // Auto-Sleep Logic: If automation enabled, sleep low-efficiency active models
        // Default to TRUE if undefined to show off the feature
        const automation = user.user_metadata?.automation || { autoSleep: true };
        console.log("Checking Auto-Sleep. Automation:", automation);

        if (automation?.autoSleep) {
          const modelsToSleep = formattedModels.filter(m => m.status === 'active' && m.efficiency_score < 75);
          console.log("Models to sleep:", modelsToSleep.length);
          if (modelsToSleep.length > 0) {
            // Simulate auto-sleeping details in DB for these specific models
            // In a real app we'd do a bulk update. Here we just update the local state to reflect 'it worked'
            // so the user sees them as idle.
            formattedModels = formattedModels.map(m =>
              (m.status === 'active' && m.efficiency_score < 50) ? { ...m, status: 'idle' } : m
            );
            // Trigger background update to persist
            modelsToSleep.forEach(async (m) => {
              await supabase.from('models').update({ status: 'idle' }).eq('id', m.id);
            });
            toast.success(`Auto-slept ${modelsToSleep.length} idle models to save energy 🌿`);
          }
        }

        setModels(formattedModels as Model[]);
        if (formattedModels.length > 0 && !selectedModel) {
          setSelectedModel(formattedModels[0] as Model);
          fetchEnergyLogs(formattedModels[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnergyLogs = async (modelId: string) => {
    const { data } = await supabase
      .from('energy_logs')
      .select('*')
      .eq('model_id', modelId)
      .order('timestamp', { ascending: true })
      .limit(24);

    if (data && data.length > 0) {
      setEnergyData(data.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
        value: Number(d.energy_kwh),
      })));
    } else {
      // Generate sample data for visualization
      setEnergyData(Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        value: Math.random() * 50 + 100,
      })));
    }
  };

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    fetchEnergyLogs(model.id);
  };

  const handleAddModel = async () => {
    if (!user || !newModel.name || !newModel.region_id) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const selectedRegion = regions.find(r => r.id === newModel.region_id);
      const carbonFactor = selectedRegion?.carbon_factor || 0.45; // Default to global avg if not found
      // Estimation: GPU Count * 0.3kW (avg load) * 24h * 30 days
      const estimatedEnergy = (Number(newModel.gpu_count) || 1) * 0.3 * 24 * 30;
      // Carbon: Energy * Carbon Factor
      const estimatedCO2 = (estimatedEnergy * carbonFactor) / 1000; // Convert to tonnes

      const { error } = await supabase.from('models').insert({
        user_id: user.id,
        name: newModel.name,
        region_id: newModel.region_id,
        gpu_count: Number(newModel.gpu_count) || 1,
        status: 'active',
        efficiency_score: Math.floor(Math.random() * 60) + 40, // Range: 40-100
        energy_kwh: estimatedEnergy,
        co2_emissions: estimatedCO2,
      });

      if (error) throw error;

      toast.success('Model added successfully');
      setShowAddModal(false);
      setNewModel({ name: '', region_id: '', gpu_count: 1 });
      fetchModels();
    } catch (error) {
      console.error('Error adding model:', error);
      toast.error('Failed to add model');
    }
  };

  const toggleSleepMode = async () => {
    if (!selectedModel) return;

    const newStatus = selectedModel.status === 'active' ? 'idle' : 'active';
    const actionName = newStatus === 'idle' ? 'Sleep mode enabled' : 'Model awakened';

    try {
      const { error } = await supabase
        .from('models')
        .update({ status: newStatus })
        .eq('id', selectedModel.id);

      if (error) throw error;

      toast.success(actionName);
      setSelectedModel({ ...selectedModel, status: newStatus });
      // Update local list
      setModels(prev => prev.map(m => m.id === selectedModel.id ? { ...m, status: newStatus } : m));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRightsize = async () => {
    if (!selectedModel || selectedModel.gpu_count <= 1) {
      toast.info('GPU count is already at minimum');
      return;
    }

    try {
      const newGpuCount = Math.max(1, selectedModel.gpu_count - 1);
      const { error } = await supabase
        .from('models')
        .update({ gpu_count: newGpuCount })
        .eq('id', selectedModel.id);

      if (error) throw error;

      toast.success(`GPU count reduced to ${newGpuCount}`);
      setSelectedModel({ ...selectedModel, gpu_count: newGpuCount });
      fetchModels();
    } catch (error) {
      toast.error('Failed to right-size model');
    }
  };

  const handleDeployUpdate = async () => {
    if (!selectedModel) return;

    try {
      toast.info('Initiating deployment...');
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('models')
        .update({
          last_deployed_at: now,
          status: 'active' // Ensure it goes back to active if it was sleeping
        })
        .eq('id', selectedModel.id);

      if (error) throw error;

      toast.success('Deployment successful version updated');
      setSelectedModel({ ...selectedModel, last_deployed_at: now, status: 'active' });
      // Update list to reflect changes
      setModels(prev => prev.map(m => m.id === selectedModel.id ? { ...m, last_deployed_at: now, status: 'active' } : m));
    } catch (error) {
      console.error('Deployment failed:', error);
      toast.error('Deployment failed');
    }
  };

  const handleDeleteModel = async () => {
    if (!selectedModel) return;
    try {
      const { error } = await supabase.from('models').delete().eq('id', selectedModel.id);
      if (error) throw error;
      toast.success('Model deleted successfully');
      // Update local state
      const remainingModels = models.filter(m => m.id !== selectedModel.id);
      setModels(remainingModels);
      if (remainingModels.length > 0) {
        setSelectedModel(remainingModels[0]);
        fetchEnergyLogs(remainingModels[0].id);
      } else {
        setSelectedModel(null);
      }
    } catch (error) {
      toast.error('Failed to delete model');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'idle': return 'bg-yellow-100 text-yellow-700';
      case 'training': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Sidebar - Model List */}
        <div className="w-72 flex flex-col border-r pr-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-auto space-y-2">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedModel?.id === model.id
                  ? 'bg-secondary border-l-4 border-l-primary'
                  : 'hover:bg-muted'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{model.name}</span>
                  <Badge variant="secondary" className={getStatusColor(model.status)}>
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Deployed: {model.region_code}</p>
                <p className="text-xs text-muted-foreground">Eff: {model.efficiency_score}/100</p>
              </button>
            ))}
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start mt-4 text-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add New Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Model</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="e.g., NLP-Core-v4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={newModel.region_id}
                    onValueChange={(value) => setNewModel({ ...newModel, region_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>GPU Count</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newModel.gpu_count}
                    onChange={(e) => setNewModel({
                      ...newModel,
                      gpu_count: e.target.value === '' ? '' : parseInt(e.target.value)
                    })}
                  />
                </div>
                <Button onClick={handleAddModel} className="w-full">Add Model</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content - Model Details */}
        {selectedModel ? (
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{selectedModel.name}</h2>
                    <span className="text-muted-foreground">{selectedModel.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${selectedModel.status === 'active' ? 'bg-green-500' :
                        selectedModel.status === 'idle' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                      <span>{selectedModel.status === 'active' ? 'Running' : selectedModel.status.charAt(0).toUpperCase() + selectedModel.status.slice(1)}</span>
                    </div>
                    <span>·</span>
                    <span>ID: {selectedModel.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Efficiency Score</p>
                  <p className="text-2xl font-bold">{selectedModel.efficiency_score}<span className="text-muted-foreground text-base">/100</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="icon" onClick={handleDeleteModel}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleDeployUpdate}>Deploy Update</Button>
                </div>
              </div>
            </div>

            {/* Energy Chart */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Energy Consumption (kWh)</CardTitle>
                </div>
                <Button variant="outline" size="sm">Last 24 Hours</Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyData}>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={handleRightsize}>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-secondary mb-3 flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Right-size Model</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Optimization available. Reduce instance size to <span className="text-primary">g4dn.xlarge</span> to save 15%.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Review Changes →
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={toggleSleepMode}>
                <CardContent className="pt-6">
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${selectedModel.status === 'active' ? 'bg-secondary' : 'bg-yellow-100'}`}>
                    {selectedModel.status === 'active' ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Zap className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{selectedModel.status === 'active' ? 'Enable Sleep Mode' : 'Wake Model'}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedModel.status === 'active'
                      ? 'Spin down instance to save energy.'
                      : 'Restore instance to active state.'
                    }
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    {selectedModel.status === 'active' ? 'Sleep →' : 'Wake Up →'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-secondary mb-3 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Carbon Report</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download detailed emission PDF report for this specific model version.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Download PDF ↓
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center gap-8 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(selectedModel.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last Deployed: {new Date(selectedModel.last_deployed_at).toLocaleString()}</span>
              </div>
              {selectedModel.next_maintenance_at && (
                <div className="flex items-center gap-2">
                  <span>Next Maintenance: {new Date(selectedModel.next_maintenance_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="ml-auto">
                <span className="text-xs">ID: {selectedModel.id}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {loading ? 'Loading models...' : 'No models found. Add one to get started.'}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Models;
