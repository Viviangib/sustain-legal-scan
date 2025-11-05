import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface FrameworkStepProps {
  onNext: () => void;
  onPrevious?: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
}

interface LegalFramework {
  id: string;
  name: string;
  description: string;
  category: string;
  jurisdiction: string;
  effective_date: string;
}

export function FrameworkStep({ onNext, onPrevious, onDataUpdate }: FrameworkStepProps) {
  const [frameworks, setFrameworks] = useState<LegalFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFrameworks = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setFrameworks(data || []);
    } catch (error: any) {
      console.error('Error fetching frameworks:', error);
      toast({
        variant: "destructive",
        title: "Failed to load frameworks",
        description: error.message || "There was an error loading legal frameworks.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedFramework) {
      toast({
        variant: "destructive",
        title: "Framework required",
        description: "Please select a legal framework to benchmark against.",
      });
      return;
    }

    const framework = frameworks.find(f => f.id === selectedFramework);
    onDataUpdate({ legalFramework: framework });
    onNext();
  };

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'due diligence':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'environmental':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reporting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading legal frameworks...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Select Legal Framework</span>
          </CardTitle>
          <CardDescription>
            Choose the legal framework you want to benchmark your sustainability indicators against
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedFramework} onValueChange={setSelectedFramework}>
            <div className="space-y-4">
              {frameworks.map((framework) => (
                <div key={framework.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={framework.id} id={framework.id} className="mt-1" />
                  <Label htmlFor={framework.id} className="flex-1 cursor-pointer">
                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{framework.name}</h4>
                        <Badge className={getCategoryColor(framework.category)}>
                          {framework.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{framework.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Jurisdiction: {framework.jurisdiction}</span>
                        <span>Effective: {framework.name === 'CS3D' ? '2026/2027' : framework.name === 'CSRD' ? '2027/2028' : new Date(framework.effective_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedFramework && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Framework selected</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Your sustainability indicators will be benchmarked against the {frameworks.find(f => f.id === selectedFramework)?.name} requirements.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {onPrevious && (
              <Button onClick={onPrevious} variant="outline">
                Previous Step
              </Button>
            )}
            <Button onClick={handleContinue} disabled={!selectedFramework} className={onPrevious ? '' : 'ml-auto'}>
              Continue to Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}