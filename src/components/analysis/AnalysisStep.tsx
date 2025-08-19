import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, RefreshCw, CheckCircle, Brain } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface AnalysisStepProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function AnalysisStep({ onNext, onDataUpdate, data }: AnalysisStepProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [completed, setCompleted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (!data.project || !data.document || !data.legalFramework || !data.indicators.length) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please complete all previous steps before running analysis.",
      });
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setCurrentStatus('Initializing AI analysis...');

    try {
      // Create analysis record
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('analysis_results')
        .insert({
          project_id: data.project.id,
          user_id: user?.id,
          analysis_type: 'benchmarking',
          analysis_status: 'processing',
          input_parameters: {
            legal_framework_id: data.legalFramework.id,
            indicators: data.indicators,
            document_id: data.document.id
          }
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Simulate analysis progress
      const steps = [
        'Analyzing document content...',
        'Mapping indicators to legal requirements...',
        'Calculating compliance scores...',
        'Identifying gaps and opportunities...',
        'Generating recommendations...',
        'Finalizing analysis report...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStatus(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // TODO: Replace with your actual FAST API endpoint
      const apiEndpoint = 'YOUR_FAST_API_ENDPOINT/run-analysis';
      
      // Simulate API response for now
      const mockResults = {
        compliance_score: 78.5,
        results: {
          total_indicators: data.indicators.length,
          compliant_indicators: Math.floor(data.indicators.length * 0.785),
          gaps_identified: Math.floor(data.indicators.length * 0.215),
          critical_gaps: 3,
          recommendations_count: 12
        },
        recommendations: `Based on the analysis of your sustainability framework against ${data.legalFramework.name} requirements, we've identified several key areas for improvement:\n\n1. Enhanced GHG emissions reporting with specific reduction targets\n2. Improved supply chain due diligence processes\n3. Strengthened biodiversity impact assessments\n4. Better integration of ESG risks in governance framework`
      };

      // Update analysis record with results
      const { error: updateError } = await supabase
        .from('analysis_results')
        .update({
          analysis_status: 'completed',
          compliance_score: mockResults.compliance_score,
          results: mockResults.results,
          recommendations: mockResults.recommendations,
          processing_time_seconds: 12,
          ai_model_used: 'GPT-4'
        })
        .eq('id', analysisRecord.id);

      if (updateError) throw updateError;

      // Update project status
      await supabase
        .from('projects')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        })
        .eq('id', data.project.id);

      onDataUpdate({ 
        analysisResults: {
          ...analysisRecord,
          compliance_score: mockResults.compliance_score,
          results: mockResults.results,
          recommendations: mockResults.recommendations
        }
      });

      setCompleted(true);
      setCurrentStatus('Analysis completed successfully!');

      toast({
        title: "Analysis complete",
        description: "Your sustainability framework analysis has been completed successfully.",
      });

      // Actual API call would look like this:
      /*
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: data.project.id,
          document_id: data.document.id,
          legal_framework_id: data.legalFramework.id,
          indicators: data.indicators
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();
      // Update database with real results
      */

    } catch (error: any) {
      console.error('Analysis error:', error);
      setCurrentStatus('Analysis failed');
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "There was an error running the analysis.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (!completed) {
      toast({
        variant: "destructive",
        title: "Analysis not complete",
        description: "Please wait for the analysis to finish before continuing.",
      });
      return;
    }
    
    onNext();
  };

  useEffect(() => {
    // Auto-start analysis when component mounts
    runAnalysis();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI-Powered Analysis</span>
          </CardTitle>
          <CardDescription>
            Our AI is analyzing your sustainability framework against {data.legalFramework?.name} requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analysis Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center space-x-2">
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              ) : completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : null}
              <span className={`text-sm ${completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                {currentStatus}
              </span>
            </div>
          </div>

          {completed && data.analysisResults && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Analysis Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-600 font-medium">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-800">
                    {data.analysisResults.compliance_score}%
                  </p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Total Indicators</p>
                  <p className="text-lg font-semibold text-green-800">
                    {data.analysisResults.results.total_indicators}
                  </p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Compliant</p>
                  <p className="text-lg font-semibold text-green-800">
                    {data.analysisResults.results.compliant_indicators}
                  </p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Gaps Found</p>
                  <p className="text-lg font-semibold text-green-800">
                    {data.analysisResults.results.gaps_identified}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={runAnalysis} 
              disabled={analyzing}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {analyzing ? 'Running...' : 'Run Analysis Again'}
            </Button>
            
            <Button onClick={handleContinue} disabled={!completed}>
              View Detailed Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}