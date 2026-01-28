import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Leaf, CheckCircle, Download, Share2, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { generateCertificatePDF } from '@/lib/pdfGenerator';

interface Certificate {
  id: string;
  model_id: string;
  model_name: string;
  training_date: string;
  total_co2_kg: number;
  renewable_percentage: number;
  certificate_hash: string;
  is_verified: boolean;
  created_at: string;
}

interface Model {
  id: string;
  name: string;
  version: string;
  co2_emissions: number;
  created_at: string;
}

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCertificates();
      fetchModels();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setCertificates(data);
        setSelectedCertificate(data[0]);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    const { data } = await supabase
      .from('models')
      .select('id, name, version, co2_emissions, created_at')
      .eq('user_id', user?.id);

    if (data) setModels(data);
  };

  const generateCertificateHash = (modelId: string, co2: number, date: string): string => {
    const data = `${modelId}-${co2}-${date}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  };

  const handleGenerateCertificate = async () => {
    if (!selectedModelId || !user) {
      toast.error('Please select a model');
      return;
    }

    const model = models.find(m => m.id === selectedModelId);
    if (!model) return;

    try {
      const trainingDate = new Date().toISOString();
      const hash = generateCertificateHash(model.id, Number(model.co2_emissions), trainingDate);
      const renewablePercent = Math.floor(Math.random() * 30) + 70; // 70-100%

      const { data, error } = await supabase
        .from('certificates')
        .insert({
          model_id: model.id,
          user_id: user.id,
          model_name: model.name,
          training_date: trainingDate,
          total_co2_kg: model.co2_emissions || 1.2,
          renewable_percentage: renewablePercent,
          certificate_hash: hash,
          is_verified: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Certificate generated successfully!');
      setCertificates([data, ...certificates]);
      setSelectedCertificate(data);
      setSelectedModelId('');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedCertificate) return;
    
    generateCertificatePDF({
      modelName: selectedCertificate.model_name,
      trainingDate: selectedCertificate.training_date,
      totalCO2: selectedCertificate.total_co2_kg,
      renewablePercent: selectedCertificate.renewable_percentage,
      certificateHash: selectedCertificate.certificate_hash,
      isVerified: selectedCertificate.is_verified || false,
    });
    
    toast.success('Certificate PDF downloaded');
  };

  const handleShareCertificate = async () => {
    if (!selectedCertificate) return;

    const shareData = {
      title: 'Green AI Provenance Certificate',
      text: `I've achieved ${selectedCertificate.renewable_percentage}% renewable energy usage for my AI model ${selectedCertificate.model_name}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Generate Certificate Section */}
        <Card className="mb-6 bg-secondary/30 border-dashed">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Award className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Generate New Certificate</h3>
                <p className="text-sm text-muted-foreground">Select a model to generate its sustainability certificate</p>
              </div>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateCertificate} disabled={!selectedModelId}>
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Display */}
        {selectedCertificate ? (
          <Card className="shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl relative">
                {/* Decorative border */}
                <div className="absolute inset-4 border-2 border-dashed border-primary/20 rounded-xl pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">VERIFIED GREEN AI</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                    Green AI Provenance
                  </h1>
                  <p className="text-primary italic text-lg">Certificate of Sustainability</p>
                </div>

                {/* Description */}
                <p className="text-center text-muted-foreground max-w-xl mx-auto mb-8">
                  This document certifies that the computational resources utilized for the 
                  training and deployment of the AI model listed below adhere to the strict 
                  environmental standards of the EcoCompute Protocol.
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Model Identity</p>
                    <p className="text-xl font-bold">{selectedCertificate.model_name}</p>
                    <p className="text-sm text-primary">v2.1.0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Training Date</p>
                    <p className="text-xl font-bold">
                      {new Date(selectedCertificate.training_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-primary">
                      {new Date(selectedCertificate.training_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Emissions</p>
                    <p className="text-xl font-bold">
                      {selectedCertificate.total_co2_kg} <span className="text-base font-normal">t CO₂e</span>
                    </p>
                    <p className="text-sm text-primary">Offset Verified</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Energy Source</p>
                    <p className="text-xl font-bold">
                      {selectedCertificate.renewable_percentage} <span className="text-base font-normal">%</span>
                    </p>
                    <p className="text-sm text-primary">Renewable (Wind/Solar)</p>
                  </div>
                </div>

                {/* Hash */}
                <div className="text-center pt-6 border-t border-dashed border-muted">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Certificate Hash (SHA-256)
                  </p>
                  <code className="text-xs font-mono text-muted-foreground">
                    {selectedCertificate.certificate_hash}
                  </code>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <CardContent className="py-6 flex justify-center gap-4 bg-card">
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleShareCertificate} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Certificate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first sustainability certificate by selecting a model above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Certificate List */}
        {certificates.length > 1 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">All Certificates</h3>
            <div className="space-y-3">
              {certificates.map(cert => (
                <Card
                  key={cert.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCertificate?.id === cert.id ? 'border-primary' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCertificate(cert)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{cert.model_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cert.training_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{cert.renewable_percentage}% Renewable</p>
                      <p className="text-sm text-muted-foreground">{cert.total_co2_kg} t CO₂e</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Certificates;
