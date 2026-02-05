import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel,
    SelectSeparator,
    SelectGroup,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from 'recharts';
import { Sliders, Zap, TrendingUp, AlertCircle, CheckCircle2, Save, Box } from 'lucide-react';
import { toast } from 'sonner';

const GreenTuning = () => {
    const { user } = useAuth();
    // Parameters
    const [selectedModel, setSelectedModel] = useState("bert-base");
    const [paramCount, setParamCount] = useState(7); // Billions (Base)
    const [quantization, setQuantization] = useState(1); // 0=FP32, 1=FP16, 2=INT8
    const [datasetSize, setDatasetSize] = useState(80); // %
    const [userModels, setUserModels] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchUserModels = async () => {
            const { data } = await supabase.from('models').select('*').eq('user_id', user.id);
            if (data) setUserModels(data);
        };
        fetchUserModels();
    }, [user]);

    // Model Definitions (Base Params)
    const baseModels = {
        "bert-base": { name: "BERT-Base", baseParams: 0.11, type: "NLP" },
        "bert-large": { name: "BERT-Large", baseParams: 0.34, type: "NLP" },
        "resnet-50": { name: "ResNet-50", baseParams: 0.025, type: "Vision" },
        "gpt-2": { name: "GPT-2", baseParams: 1.5, type: "NLP" },
        "llama-7b": { name: "Llama-2-7b", baseParams: 7, type: "LLM" },
    };

    const models = useMemo(() => {
        const userModelMap = userModels.reduce((acc, m) => {
            acc[m.id] = {
                name: m.name,
                baseParams: (m.gpu_count || 1) * 2.5, // Rough estimate: 2.5B params per GPU unit
                type: "Custom"
            };
            return acc;
        }, {} as Record<string, any>);
        return { ...baseModels, ...userModelMap };
    }, [userModels]);

    // Derived Metrics (Simulated Physics)
    const metrics = useMemo(() => {
        const model = models[selectedModel as keyof typeof models];

        // 1. Quantization Factor
        let qEff = 1.0;
        let qAcc = 1.0;
        let qLabel = 'FP32';

        if (quantization === 1) { qEff = 0.6; qAcc = 0.99; qLabel = 'FP16'; }
        if (quantization >= 2) { qEff = 0.3; qAcc = 0.96; qLabel = 'INT8'; }

        // 2. Param Factor (Relative to Llama-7b as baseline = 1.0 energy wise for this scale)
        // If we choose Llama-7b (7B params), and slider is at 7, then 1.0.
        // Actually, let's override the slider default or scale it based on model selection?
        // Better: The slider adjusts the *effective* active params (like pruning).
        // Let's say the slider is "Model Scale / Pruning %".
        // OR: simpler - The slider sets the param count, but the Model Selection sets the "Architecture Efficiency".
        // Let's go with: Model Selection sets the BASE params, and the slider is irrelevant? 
        // No, user wants to tune.
        // Let's make the slider modify the "Effective Parameter Count" (Pruning).

        const effectiveParams = model.baseParams * (paramCount / 7); // leveraging the slider as a multiplier 0-10x essentially
        // Let's just say Slider = "Parameter Scale"

        const pFactor = (effectiveParams) / 7;
        const pAcc = Math.min(1.0, 0.7 + (0.3 * Math.log10(effectiveParams * 10 + 1)));

        // 3. Dataset Factor
        const dFactor = datasetSize / 100;

        // Totals
        const energyScore = Math.max(0.1, Math.round(100 * pFactor * dFactor * qEff * 10) / 10);
        const accuracyScore = Math.round(92 * pAcc * (0.8 + 0.2 * dFactor) * qAcc * 10) / 10;

        return {
            energy: energyScore,
            accuracy: accuracyScore,
            qLabel,
            modelName: model.name
        };
    }, [selectedModel, paramCount, quantization, datasetSize]);

    const handleSaveConfig = () => {
        toast.success("Configuration Saved!", {
            description: `Optimized ${metrics.modelName}: ${metrics.accuracy}% Acc, ${metrics.energy} kWh.`
        });
    };

    const chartData = [
        { name: 'Baseline (FP32)', energy: metrics.energy * 2.5, accuracy: Math.min(100, metrics.accuracy + 2) },
        { name: 'Current Config', energy: metrics.energy, accuracy: metrics.accuracy },
        { name: 'Ultra Green (INT8)', energy: metrics.energy * 0.5, accuracy: metrics.accuracy - 5 },
    ];

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Sliders className="h-8 w-8 text-primary" />
                            Green Tuning Studio
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Optimize <span className="text-foreground font-medium">{metrics.modelName}</span> performance vs. environmental impact.
                        </p>
                    </div>
                    <Button onClick={handleSaveConfig} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Configuration
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Controls Panel */}
                    <Card className="lg:col-span-4 shadow-card h-fit">
                        <CardHeader>
                            <CardTitle>Model Configuration</CardTitle>
                            <CardDescription>Select architecture and hyperparams</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            {/* Model Selector */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Model Architecture</label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Standard</SelectLabel>
                                            <SelectItem value="bert-base">BERT-Base (NLP)</SelectItem>
                                            <SelectItem value="bert-large">BERT-Large (NLP)</SelectItem>
                                            <SelectItem value="gpt-2">GPT-2 (Generative)</SelectItem>
                                            <SelectItem value="resnet-50">ResNet-50 (Vision)</SelectItem>
                                            <SelectItem value="llama-7b">Llama-2-7b (LLM)</SelectItem>
                                        </SelectGroup>
                                        <SelectSeparator />
                                        <SelectGroup>
                                            <SelectLabel>My Models</SelectLabel>
                                            {userModels.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                            {userModels.length === 0 && <SelectItem value="none" disabled>No custom models found</SelectItem>}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Parameter Count */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Pruning / Scale</span>
                                    <span className="text-sm text-primary font-bold">{(paramCount / 7).toFixed(1)}x</span>
                                </div>
                                <Slider
                                    value={[paramCount]}
                                    onValueChange={(v) => setParamCount(v[0])}
                                    min={1} max={20} step={1}
                                    className="py-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Adjusting effective model size via pruning/distillation.
                                </p>
                            </div>

                            <Separator />

                            {/* Quantization */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Quantization</span>
                                    <Badge variant="outline" className="text-primary border-primary/20">
                                        {metrics.qLabel}
                                    </Badge>
                                </div>
                                <Slider
                                    value={[quantization]}
                                    onValueChange={(v) => setQuantization(v[0])}
                                    min={0} max={2} step={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>FP32</span>
                                    <span>FP16</span>
                                    <span>INT8</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Dataset Size */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Training Data Subset</span>
                                    <span className="text-sm text-primary font-bold">{datasetSize}%</span>
                                </div>
                                <Slider
                                    value={[datasetSize]}
                                    onValueChange={(v) => setDatasetSize(v[0])}
                                    min={10} max={100} step={5}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Visualization & Metrics */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Est. Energy / Epoch</p>
                                        <Zap className={`h-5 w-5 ${metrics.energy < 10 ? 'text-green-500' : 'text-yellow-500'}`} />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold">{metrics.energy.toFixed(1)}<span className="text-lg text-muted-foreground font-medium">kWh</span></h2>
                                        <Badge variant={metrics.energy < 10 ? 'secondary' : 'outline'} className={metrics.energy < 10 ? 'bg-green-100 text-green-700' : 'text-yellow-700'}>
                                            {metrics.energy < 10 ? 'Eco-Friendly' : 'High Usage'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Projected Accuracy</p>
                                        <TrendingUp className={`h-5 w-5 ${metrics.accuracy > 90 ? 'text-green-500' : 'text-red-500'}`} />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold">{metrics.accuracy}%</h2>
                                        <span className="text-xs text-muted-foreground">Simulated Result</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Chart */}
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle>Impact Analysis: {metrics.modelName}</CardTitle>
                                <CardDescription>Comparing current config against baselines</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} fontSize={12} />
                                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--foreground))" domain={['dataMin - 5', 100]} label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight' }} fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                            />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="energy" fill="hsl(var(--primary))" barSize={40} radius={[4, 4, 0, 0]} name="Energy (Lower better)" />
                                            <Line yAxisId="right" type="linear" dataKey="accuracy" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6 }} name="Accuracy (Higher better)" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Smart Insight */}
                        <div className="p-4 rounded-lg border bg-secondary/30 flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full mt-1">
                                <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-900 dark:text-green-400">Green Tuner Insight</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    For <span className="font-semibold text-foreground">{metrics.modelName}</span>, switching to <span className="font-semibold text-foreground">INT8</span> reduces energy by <span className="font-semibold text-foreground">{(metrics.energy * 0.7).toFixed(1)} kWh</span> per run.
                                    {metrics.accuracy > 95 ? " Accuracy looks stable." : " Watch out for accuracy drops."}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default GreenTuning;
