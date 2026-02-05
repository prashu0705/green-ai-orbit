import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    ShoppingBag,
    Star,
    Zap,
    Check,
    Cpu,
    Globe,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MarketModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    efficiencyRating: 'A++' | 'A+' | 'A' | 'B';
    co2PerRequest: string;
    tags: string[];
    popular: boolean;
}

const CATALOG: MarketModel[] = [
    {
        id: 'stable-diff-eco',
        name: 'Stable Diffusion Eco',
        provider: 'Art Gen',
        description: 'Image generation model with optimized sampling steps to reduce GPU time by 30%.',
        efficiencyRating: 'B',
        co2PerRequest: '0.82g',
        tags: ['Image Gen', 'Creative', 'Optimized'],
        popular: true
    },
    {
        id: 'gpt-green-4',
        name: 'Green-GPT-4',
        provider: 'Open Sustain',
        description: 'General purpose LLM fine-tuned on carbon-neutral infrastructure. Ideal for chatbots and content gen.',
        efficiencyRating: 'A+',
        co2PerRequest: '0.45g',
        tags: ['LLM', 'Generative', 'Chat'],
        popular: true
    },
    {
        id: 'bert-eco-v2',
        name: 'Eco-BERT Large',
        provider: 'Green AI Labs',
        description: 'Optimized BERT model for NLP tasks. Distilled for 40% less energy consumption with 98% accuracy retention.',
        efficiencyRating: 'A++',
        co2PerRequest: '0.12g',
        tags: ['NLP', 'Distilled', 'Low-Code'],
        popular: true
    },
    {
        id: 'vit-efficient-b16',
        name: 'Efficient-ViT B16',
        provider: 'Computer Vision Co.',
        description: 'Vision Transformer designed for edge devices. High throughput, low latency, and minimal carbon footprint.',
        efficiencyRating: 'A++',
        co2PerRequest: '0.28g',
        tags: ['Computer Vision', 'Edge', 'Fast'],
        popular: false
    },
    {
        id: 'whisper-solar',
        name: 'Whisper Solar',
        provider: 'Audio Tech',
        description: 'Speech-to-text model trained exclusively on solar power farms. Verified renewable provenance.',
        efficiencyRating: 'A',
        co2PerRequest: '0.33g',
        tags: ['Audio', 'Speech-to-Text', 'Renewable'],
        popular: false
    },
    {
        id: 'code-llama-green',
        name: 'Code Llama Green',
        provider: 'Dev Tools Inc.',
        description: 'Code completion model hosted in Iceland (Hydro/Geothermal). Zero operational emissions.',
        efficiencyRating: 'A+',
        co2PerRequest: '0.05g',
        tags: ['Coding', 'Developer', 'Zero Carbon'],
        popular: false
    }
];

const Marketplace = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [deployingId, setDeployingId] = useState<string | null>(null);
    const [sortedCatalog, setSortedCatalog] = useState<MarketModel[]>(CATALOG);

    useEffect(() => {
        if (user) {
            personalizeFeed();
        }
    }, [user]);

    const personalizeFeed = async () => {
        // Fetch user stats to see if they need help
        const { data: models } = await supabase.from('models').select('efficiency_score').eq('user_id', user?.id);

        // If NO models (new user) or Low Score, we trigger "Helpful Mode"
        const avgScore = models && models.length > 0
            ? models.reduce((acc, m) => acc + (m.efficiency_score || 0), 0) / models.length
            : 0; // Treat new users as needing efficiency suggestions

        if (avgScore < 90 || !models || models.length === 0) {
            // User needs efficiency! Promote A++ models.
            const efficient = CATALOG.filter(m => m.efficiencyRating === 'A++');
            const others = CATALOG.filter(m => m.efficiencyRating !== 'A++');
            setSortedCatalog([...efficient, ...others]);

            if (models && models.length > 0) {
                toast.info("Notice: highlighting A++ models to help boost your fleet efficiency.");
            }
        } else {
            setSortedCatalog(CATALOG); // Standard order
        }
    };

    const handleDeploy = async (model: MarketModel) => {
        if (!user) return;
        setDeployingId(model.id);

        try {
            // Fetch a default region (preferably green)
            const { data: regions } = await supabase
                .from('regions')
                .select('id, name')
                .order('renewable_percentage', { ascending: false }) // Get greenest first
                .limit(1);

            const regionId = regions && regions[0] ? regions[0].id : null;

            if (!regionId) {
                toast.error('No suitable regions found for deployment.');
                return;
            }

            // Simulate "Procurement" delay
            await new Promise(r => setTimeout(r, 1500));

            // Insert into User's Models
            const { error } = await supabase.from('models').insert({
                user_id: user.id,
                name: model.name,
                region_id: regionId,
                gpu_count: 1, // Default start
                status: 'active',
                efficiency_score: model.efficiencyRating.includes('A') ? 95 : 85,
                energy_kwh: 120, // Initial seed
                co2_emissions: 0.05, // Initial seed
            });

            if (error) throw error;

            toast.success(`${model.name} deployed successfully!`, {
                description: "Redirecting to your models dashboard...",
            });

            setTimeout(() => {
                navigate('/models');
            }, 1500);

        } catch (error) {
            console.error("Deploy error:", error);
            toast.error("Failed to deploy model. Please try again.");
        } finally {
            setDeployingId(null);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Green Provenance Marketplace</h1>
                    <p className="text-muted-foreground">Discover and deploy pre-validated low-carbon AI models.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedCatalog.map((model) => (
                        <Card key={model.id} className="shadow-2xl border-primary/10 bg-gradient-to-br from-background/80 to-secondary/30 backdrop-blur-md hover:shadow-primary/5 transition-all duration-300 flex flex-col group">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={`${model.efficiencyRating === 'A++' ? 'bg-green-100 text-green-700 border-green-200' :
                                        model.efficiencyRating === 'A+' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                        {model.efficiencyRating} Efficiency
                                    </Badge>
                                    <div className="flex gap-2">
                                        {/* Live Badge */}
                                        <Badge className="bg-green-500/10 text-green-600 border-0 flex items-center gap-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Live
                                        </Badge>
                                        {model.popular && (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                                <Star className="w-3 h-3 mr-1 fill-amber-700" /> Popular
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                    {model.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    by {model.provider} <Check className="w-3 h-3 text-blue-500 ml-1" />
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground mb-4 min-h-[60px]">
                                    {model.description}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-secondary/50 p-2 rounded flex items-center gap-2 text-xs">
                                        <Zap className="w-3 h-3 text-yellow-600" />
                                        <span>{model.co2PerRequest} / req</span>
                                    </div>
                                    <div className="bg-secondary/50 p-2 rounded flex items-center gap-2 text-xs">
                                        <Globe className="w-3 h-3 text-green-600" />
                                        <span>Carbon Neutral</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {model.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 mt-auto">
                                <Button
                                    className="w-full"
                                    onClick={() => handleDeploy(model)}
                                    disabled={!!deployingId}
                                >
                                    {deployingId === model.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deploying...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            Deploy Now
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
};

export default Marketplace;
