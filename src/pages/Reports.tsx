import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Leaf,
  TrendingUp,
  Sun,
  Download,
  FileText,
  Award,
  Sparkles,
  AlertCircle,
  Star,
  Cpu,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { generatePerformanceReportPDF } from '@/lib/pdfGenerator';

interface ReportStats {
  co2Savings: number;
  efficiencyGain: number;
  renewablePercent: number;
}

interface EmissionData {
  month: string;
  current: number;
  baseline: number;
}

interface AIInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  highlight?: string;
}

const Reports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReportStats>({
    co2Savings: -4.2,
    efficiencyGain: 18,
    renewablePercent: 92,
  });
  const [emissionData, setEmissionData] = useState<EmissionData[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [viewType, setViewType] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    try {
      // Fetch carbon logs for emissions over time
      const { data: carbonLogs } = await supabase
        .from('carbon_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: true });

      if (carbonLogs && carbonLogs.length > 0) {
        // Process real data
        const monthlyData = processMonthlyData(carbonLogs);
        setEmissionData(monthlyData);
      } else {
        // Generate sample data for visualization
        setEmissionData([
          { month: 'Jun', current: 2.1, baseline: 3.8 },
          { month: 'Jul', current: 1.8, baseline: 3.6 },
          { month: 'Aug', current: 2.4, baseline: 4.0 },
          { month: 'Sep', current: 1.5, baseline: 3.2 },
          { month: 'Oct', current: 1.2, baseline: 2.8 },
        ]);
      }

      // Fetch models for stats
      const { data: models } = await supabase
        .from('models')
        .select('co2_emissions, efficiency_score')
        .eq('user_id', user?.id);

      if (models && models.length > 0) {
        const totalCO2 = models.reduce((sum, m) => sum + Number(m.co2_emissions || 0), 0);
        const avgEfficiency = models.reduce((sum, m) => sum + Number(m.efficiency_score || 0), 0) / models.length;

        setStats(prev => ({
          ...prev,
          efficiencyGain: Math.round(avgEfficiency - 76), // Compared to baseline
          co2Savings: -(totalCO2 * 0.3).toFixed(1) as unknown as number, // Estimated savings
        }));

        generateInsights(models);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (logs: any[]): EmissionData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const grouped: { [key: string]: number[] } = {};

    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const monthKey = months[date.getMonth()];
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(Number(log.co2_kg));
    });

    return Object.entries(grouped).map(([month, values]) => ({
      month,
      current: values.reduce((a, b) => a + b, 0),
      baseline: values.reduce((a, b) => a + b, 0) * 1.5, // Simulated baseline
    }));
  };

  const generateInsights = (models: any[]) => {
    const newInsights: AIInsight[] = [];

    if (!models || models.length === 0) {
      newInsights.push({
        type: 'info',
        title: 'No Data Detected',
        description: 'Add models to your dashboard to generate specific AI insights.',
      });
      setInsights(newInsights);
      return;
    }

    // 1. Efficiency Insight
    // Logic: Find worst performer to warn, OR best performer to praise
    const sortedByEff = [...models].sort((a, b) => (a.efficiency_score || 0) - (b.efficiency_score || 0));
    const worstModel = sortedByEff[0];
    const bestModel = sortedByEff[sortedByEff.length - 1];

    if ((worstModel.efficiency_score || 0) < 70) {
      newInsights.push({
        type: 'warning',
        title: 'Optimization Needed',
        description: `Model ${worstModel.name} is underperforming`,
        highlight: `(${worstModel.efficiency_score}/100 efficiency)`,
      });
    } else {
      newInsights.push({
        type: 'success',
        title: 'High Efficiency',
        description: `Model ${bestModel.name} is running optimally`,
        highlight: `(${bestModel.efficiency_score}/100 efficiency)`,
      });
    }

    // 2. Region/Carbon Insight
    // Logic: Check for high emissions > 0.5t (arbitrary threshold for "dirty")
    const highEmissionModel = models.find((m: any) => m.co2_emissions > 0.5);
    if (highEmissionModel) {
      newInsights.push({
        type: 'info',
        title: 'Region Opportunity',
        description: `Switching ${highEmissionModel.name} to a greener region could save`,
        highlight: '30-40% CO₂',
      });
    } else {
      newInsights.push({
        type: 'success',
        title: 'Green Infrastructure',
        description: 'Your workloads are running in low-carbon regions.',
        highlight: 'Excellent Choice',
      });
    }

    // 3. General System Health
    // Logic: Generic health check based on average score
    const avgScore = models.reduce((s, m) => s + (m.efficiency_score || 0), 0) / models.length;
    if (avgScore > 80) {
      newInsights.push({
        type: 'info',
        title: 'System Health',
        description: 'Global compute resources are healthy.',
        highlight: 'Stable',
      });
    } else {
      newInsights.push({
        type: 'info',
        title: 'Resource Monitor',
        description: 'Consider rightsizing instances to improve average score.',
      });
    }

    setInsights(newInsights);
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Current Emissions (t)', 'Baseline (t)'];
    const rows = emissionData.map(d => [d.month, d.current, d.baseline]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carbon-audit-report.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    generatePerformanceReportPDF({
      co2Savings: stats.co2Savings,
      efficiencyGain: stats.efficiencyGain,
      renewablePercent: stats.renewablePercent,
      emissionData,
      insights,
      generatedDate: new Date().toLocaleDateString(),
    });
    toast.success('PDF report exported successfully');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-eco-orange" />;
      case 'success': return <Star className="h-4 w-4 text-eco-green" />;
      case 'info': return <Cpu className="h-4 w-4 text-primary" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Performance Reports</h1>
            <p className="text-muted-foreground">Audit your environmental impact and efficiency.</p>
          </div>
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly View</SelectItem>
              <SelectItem value="quarterly">Quarterly View</SelectItem>
              <SelectItem value="yearly">Yearly View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Executive Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{stats.co2Savings}t</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">CO₂ Savings</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">+{stats.efficiencyGain}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Efficiency</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-eco-yellow/10 mx-auto mb-3 flex items-center justify-center">
                    <Sun className="h-5 w-5 text-eco-yellow" />
                  </div>
                  <p className="text-3xl font-bold">{stats.renewablePercent}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Renewable</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emissions Chart */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Emissions Over Time
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted-foreground/30" />
                  <span>Baseline</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emissionData} barGap={8}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="baseline" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Available Downloads */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Available Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={handleExportCSV}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Carbon Audit Report</p>
                      <p className="text-sm text-muted-foreground">Q4 2024 • CSV</p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Model Efficiency Log</p>
                      <p className="text-sm text-muted-foreground">Q4 2024 • CSV</p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Green Certificates</p>
                      <p className="text-sm text-muted-foreground">Verified Bundle • 28</p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  AI Insights
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">Updated 1h ago</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}{' '}
                        {insight.highlight && (
                          <span className="text-primary font-medium">{insight.highlight}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
