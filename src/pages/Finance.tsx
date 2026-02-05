import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    ShieldCheck,
    TrendingDown,
    Coins,
    FileText,
    AlertTriangle,
    CheckCircle2,
    PieChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RiskMetrics {
    riskScore: number;
    premiumStatus: 'Standard' | 'Discounted' | 'Surcharge';
    basePremium: number;
    actualPremium: number;
    potentialSavings: number;
    forecastedOverrun: number; // Percentage probability
}

const Finance = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<RiskMetrics>({
        riskScore: 0,
        premiumStatus: 'Standard',
        basePremium: 10000,
        actualPremium: 10000,
        potentialSavings: 0,
        forecastedOverrun: 15,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            calculateRiskScore();
        }
    }, [user]);

    const calculateRiskScore = async () => {
        try {
            // Fetch models to assess risk based on efficiency
            const { data: models } = await supabase
                .from('models')
                .select('efficiency_score, co2_emissions')
                .eq('user_id', user?.id);

            if (models && models.length > 0) {
                const avgEfficiency = models.reduce((sum, m) => sum + (m.efficiency_score || 0), 0) / models.length;
                const totalEmissions = models.reduce((sum, m) => sum + (m.co2_emissions || 0), 0);

                // simple formula: Risk Score matches Efficiency (Higher Efficiency = Lower Risk / Better Score)
                // Let's say Score 100 is Perfect Safety.
                const score = Math.round(avgEfficiency);

                let status: RiskMetrics['premiumStatus'] = 'Standard';
                let discountFactor = 1.0;

                if (score >= 80) {
                    status = 'Discounted';
                    discountFactor = 0.8; // 20% off
                } else if (score < 50) {
                    status = 'Surcharge';
                    discountFactor = 1.2; // 20% surcharge
                }

                // Dynamic Base Premium: Scales with fleet size ($2,500 per model)
                // Minimum $5,000 so it doesn't look empty for small fleets.
                const base = Math.max(5000, models.length * 2500);
                const actual = Math.round(base * discountFactor);

                // Real Savings Calculation:
                // Assume Carbon Tax avoided = Total Emissions * $50/ton + Insurance Savings
                const carbonTaxSavings = Math.round(totalEmissions * 50);
                const insuranceSavings = status === 'Discounted' ? base - actual : 0;

                setMetrics({
                    riskScore: score,
                    premiumStatus: status,
                    basePremium: base,
                    actualPremium: actual,
                    potentialSavings: insuranceSavings + carbonTaxSavings,
                    forecastedOverrun: score > 80 ? 2 : score > 50 ? 15 : 65
                });
            } else {
                // Default state for no modes
                setMetrics({
                    riskScore: 50, // Neutral
                    premiumStatus: 'Standard',
                    basePremium: 5000,
                    actualPremium: 5000,
                    potentialSavings: 0,
                    forecastedOverrun: 15
                });
            }
        } catch (error) {
            console.error('Error calculating risk:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyForBond = () => {
        toast.success("Application Submitted! Allianz team will review your Green Bond request.");
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Green-AI Financial Suite</h1>
                    <p className="text-muted-foreground">Manage insurance premiums and green financing based on your carbon score.</p>
                </div>

                {/* Top Row: Risk Score & Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Risk Score Card */}
                    <Card className="shadow-sm border border-border/50 bg-card border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Carbon Risk Score</CardTitle>
                                    <CardDescription>Based on model efficiency & regional intensity</CardDescription>
                                </div>
                                <ShieldCheck className={`h-8 w-8 ${metrics.riskScore >= 80 ? 'text-green-500' : metrics.riskScore < 50 ? 'text-red-500' : 'text-yellow-500'}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-bold tracking-tight">{metrics.riskScore}</span>
                                    <span className="text-muted-foreground mb-1 font-medium">/ 100</span>
                                </div>
                                <Progress value={metrics.riskScore} className="h-2 bg-secondary" indicatorClassName={metrics.riskScore >= 80 ? 'bg-green-500' : 'bg-primary'} />
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <span>High Risk</span>
                                    <span>Moderate</span>
                                    <span>Safe</span>
                                </div>

                                {/* AI Prediction Badge */}
                                <div className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded mt-2">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" /> Predicted Overrun
                                    </span>
                                    <span className={`font-bold ${metrics.forecastedOverrun > 20 ? 'text-red-500' : 'text-green-600'}`}>
                                        {metrics.forecastedOverrun}% Chance
                                    </span>
                                </div>

                                <div className="bg-secondary/30 p-3 rounded-lg flex gap-3 items-start text-sm">
                                    {metrics.riskScore >= 80 ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                    )}
                                    <span className="leading-relaxed text-muted-foreground">
                                        {metrics.riskScore >= 80
                                            ? "Excellent! Your AI fleet is optimized. You qualify for the 'Green Tier' insurance package."
                                            : metrics.riskScore >= 70
                                                ? "Green Financing Unlocked! Reach score > 80 to unlock premium insurance discounts."
                                                : "Improve efficiency > 70 to unlock Green Financing options."}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Premium Calculator */}
                    <Card className="shadow-sm border border-border/50 bg-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>AI Liability Premium</CardTitle>
                                    <CardDescription>Dynamic pricing powered by data</CardDescription>
                                </div>
                                <Coins className="h-8 w-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-secondary/30 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Base Rate</p>
                                    <p className="text-2xl font-semibold text-muted-foreground line-through decoration-red-500/50">
                                        ${metrics.basePremium.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-sm font-bold text-primary mb-1">Your Rate</p>
                                    <p className="text-3xl font-bold text-primary tracking-tight">
                                        ${metrics.actualPremium.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {metrics.potentialSavings > 0 ? (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 text-sm font-medium">
                                    <TrendingDown className="h-4 w-4" />
                                    You are saving ${metrics.potentialSavings.toLocaleString()} / month
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground p-3 bg-secondary/30 rounded-lg">
                                    Optimization could save you up to <span className="font-semibold text-foreground">${(metrics.basePremium * 0.2).toLocaleString()}</span> / month.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Green Bonds Section */}
                <Card className="shadow-sm border border-border/50 bg-card">
                    <CardHeader>
                        <CardTitle>Green Financing Offers</CardTitle>
                        <CardDescription>Exclusive capital for sustainable infrastructure</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Offer 1 - Dynamic Lock */}
                            <div className={`border border-border/50 rounded-xl p-6 transition-all group relative overflow-hidden ${metrics.riskScore >= 70
                                ? 'hover:border-primary/50 hover:bg-secondary/40 border-primary/20'
                                : 'opacity-60 grayscale bg-muted/20'
                                }`}>
                                {metrics.riskScore < 70 ? (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                                        <Badge variant="destructive" className="font-bold shadow-lg">LOCKED (Req. Score 70+)</Badge>
                                    </div>
                                ) : (
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                                        </Badge>
                                    </div>
                                )}
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PieChart className="h-6 w-6 text-green-700" />
                                </div>
                                <h3 className="font-bold text-lg">Infrastructure Upgrade Loan</h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">Low-interest financing to move on-prem hardware to green cloud regions.</p>
                                <ul className="text-sm space-y-3 mb-6">
                                    <li className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">APR</span>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 font-bold border-green-200">3.2%</Badge>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Term</span>
                                        <span className="font-bold">5 Years</span>
                                    </li>
                                </ul>
                                <Button className="w-full shadow-lg shadow-green-900/10" disabled={metrics.riskScore < 70} onClick={handleApplyForBond}>
                                    Apply Now
                                </Button>
                            </div>

                            {/* Offer 2 */}
                            <div className="border border-border/50 rounded-xl p-6 hover:border-primary/50 hover:bg-secondary/40 transition-all group">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Coins className="h-6 w-6 text-blue-700" />
                                </div>
                                <h3 className="font-bold text-lg">Carbon Offset Grant</h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">Direct grants to purchase high-quality removal credits.</p>
                                <ul className="text-sm space-y-3 mb-6">
                                    <li className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Amount</span>
                                        <span className="font-bold">Up to $50k</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Type</span>
                                        <Badge variant="secondary">Grant</Badge>
                                    </li>
                                </ul>
                                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 text-primary" onClick={handleApplyForBond}>View Eligibility</Button>
                            </div>

                            {/* Offer 3 */}
                            <div className="border border-primary/20 rounded-xl p-6 transition-all bg-gradient-to-br from-primary/5 via-background to-transparent relative overflow-hidden group flex flex-col">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <ShieldCheck className="h-32 w-32 rotate-12" />
                                </div>
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg relative z-10">Allianz Green Shield</h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed relative z-10">Comprehensive coverage for AI compliance & environmental liability.</p>
                                <div className="mt-auto relative z-10">
                                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleApplyForBond}>
                                        Activate Coverage
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Finance;
