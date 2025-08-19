import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Loader2 } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface IndicatorStepProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function IndicatorStep({ onNext, onDataUpdate, data }: IndicatorStepProps) {
  const [indicators, setIndicators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    
    try {
      // TODO: Replace with your FAST API endpoint
      // const response = await fetch('YOUR_FAST_API_ENDPOINT/extract-indicators', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     document_id: data.document.id,
      //     storage_path: data.document.storage_path
      //   }),
      // });
      // const result = await response.json();

      // Mock indicators for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockIndicators = [
        'GHG emissions reduction targets',
        'Water consumption monitoring',
        'Waste management practices',
        'Employee diversity metrics',
        'Supply chain sustainability'
      ];
      
      setIndicators(mockIndicators);
      onDataUpdate({ indicators: mockIndicators });
      
      toast({
        title: "Indicators extracted",
        description: `Found ${mockIndicators.length} sustainability indicators.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: error.message || "Failed to extract indicators.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (indicators.length === 0) {
      toast({
        variant: "destructive",
        title: "No indicators",
        description: "Please extract indicators first.",
      });
      return;
    }
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5" />
          <span>Extract Sustainability Indicators</span>
        </CardTitle>
        <CardDescription>
          Extract sustainability indicators from your document using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {indicators.length === 0 ? (
          <div className="text-center py-8">
            <Button onClick={extractIndicators} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Extract Indicators
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-green-600">✓ Found {indicators.length} indicators</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {indicators.map((indicator, index) => (
                <Badge key={index} variant="secondary" className="p-2 text-sm">
                  {indicator}
                </Badge>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={extractIndicators} disabled={loading}>
                Re-extract
              </Button>
              <Button onClick={handleContinue}>Continue</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}