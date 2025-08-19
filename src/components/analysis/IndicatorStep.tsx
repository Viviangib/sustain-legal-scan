import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, RefreshCw, CheckCircle } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface IndicatorStepProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function IndicatorStep({ onNext, onDataUpdate, data }: IndicatorStepProps) {
  const [indicators, setIndicators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const { toast } = useToast();

  const extractIndicators = async () => {
    if (!data.document) {
      toast({
        variant: "destructive",
        title: "No document found",
        description: "Please upload a document first.",
      });
      return;
    }

    setExtracting(true);
    
    // TODO: Replace with your actual FAST API endpoint
    const apiEndpoint = 'YOUR_FAST_API_ENDPOINT/extract-indicators';
    
    try {
      // Simulate API call for now
      setTimeout(() => {
        const mockIndicators = [
          'GHG emissions reduction targets',
          'Water consumption monitoring',
          'Waste management practices',
          'Employee diversity metrics',
          'Supply chain sustainability',
          'Energy efficiency measures',
          'Biodiversity conservation efforts',
          'Community engagement programs',
          'Governance transparency',
          'Risk management framework'
        ];
        
        setIndicators(mockIndicators);
        onDataUpdate({ indicators: mockIndicators });
        setExtracting(false);
        
        toast({
          title: "Indicators extracted",
          description: `Found ${mockIndicators.length} sustainability indicators in your document.`,
        });
      }, 3000);

      // Actual API call would look like this:
      /*
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: data.document.id,
          storage_path: data.document.storage_path
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract indicators');
      }

      const result = await response.json();
      setIndicators(result.indicators);
      onDataUpdate({ indicators: result.indicators });
      
      toast({
        title: "Indicators extracted",
        description: `Found ${result.indicators.length} sustainability indicators in your document.`,
      });
      */
    } catch (error: any) {
      console.error('Indicator extraction error:', error);
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: error.message || "There was an error extracting indicators from your document.",
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleContinue = () => {
    if (indicators.length === 0) {
      toast({
        variant: "destructive",
        title: "No indicators found",
        description: "Please extract indicators first before continuing.",
      });
      return;
    }
    
    onNext();
  };

  useEffect(() => {
    // Auto-extract indicators when component mounts
    extractIndicators();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Sustainability Indicators</span>
          </CardTitle>
          <CardDescription>
            AI-powered extraction of sustainability indicators from your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extracting ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Extracting indicators from your document...</span>
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ) : indicators.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully extracted {indicators.length} indicators</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {indicators.map((indicator, index) => (
                  <Badge key={index} variant="secondary" className="p-3 justify-start text-sm">
                    {indicator}
                  </Badge>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={extractIndicators} disabled={extracting}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-extract
                </Button>
                <Button onClick={handleContinue}>
                  Continue with These Indicators
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No indicators extracted yet</p>
              <Button onClick={extractIndicators} disabled={extracting}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Extract Indicators
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}