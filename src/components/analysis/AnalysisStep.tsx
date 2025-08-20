import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Loader2 } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface AnalysisStepProps {
  onNext: () => void;
  onPrevious?: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function AnalysisStep({ onNext, onPrevious, onDataUpdate, data }: AnalysisStepProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (!data.project || !data.document || !data.legalFramework) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please complete all previous steps.",
      });
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    try {
      // Create analysis record
      const { data: analysisRecord, error } = await supabase
        .from('analysis_results')
        .insert({
          project_id: data.project.id,
          user_id: user?.id,
          analysis_type: 'benchmarking',
          analysis_status: 'processing',
          input_parameters: {
            legal_framework_id: data.legalFramework.id,
            supporting_documents: data.supportingDocuments?.length || 0,
            document_id: data.document.id
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // TODO: Replace with your FAST API endpoint
      // const response = await fetch('YOUR_FAST_API_ENDPOINT/run-analysis', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     project_id: data.project.id,
      //     document_id: data.document.id,
      //     legal_framework_id: data.legalFramework.id,
      //     indicators: data.indicators
      //   }),
      // });
      // const analysisResults = await response.json();

      // Mock results for demo
      const mockResults = {
        compliance_score: 78.5,
        results: {
          total_indicators: 15,
          compliant_indicators: 12,
          gaps_identified: 3,
          critical_gaps: 1,
          supporting_documents_processed: data.supportingDocuments?.length || 0
        },
        recommendations: 'Key improvement areas identified in GHG reporting, supply chain processes, and governance framework. Supporting documents provided additional context for comprehensive analysis.'
      };

      // Update database
      await supabase
        .from('analysis_results')
        .update({
          analysis_status: 'completed',
          compliance_score: mockResults.compliance_score,
          results: mockResults.results,
          recommendations: mockResults.recommendations
        })
        .eq('id', analysisRecord.id);

      await supabase
        .from('projects')
        .update({ status: 'completed', progress_percentage: 100 })
        .eq('id', data.project.id);

      setResults({
        ...analysisRecord,
        ...mockResults
      });

      onDataUpdate({ analysisResults: { ...analysisRecord, ...mockResults } });

      toast({
        title: "Analysis complete",
        description: "Your sustainability framework analysis is ready.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to run analysis.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>AI Analysis</span>
        </CardTitle>
        <CardDescription>
          Analyzing your framework against {data.legalFramework?.name} requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <div className="space-y-4">
            {analyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            <div className="text-center py-8">
              <Button onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {results.compliance_score}%
              </div>
              <p className="text-muted-foreground">Compliance Score</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{results.results.total_indicators}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{results.results.compliant_indicators}</div>
                <div className="text-sm text-muted-foreground">Compliant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{results.results.gaps_identified}</div>
                <div className="text-sm text-muted-foreground">Gaps</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              {onPrevious && (
                <Button onClick={onPrevious} variant="outline">
                  Previous Step
                </Button>
              )}
              <Button onClick={onNext} className={onPrevious ? '' : 'ml-auto'}>View Full Results</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}