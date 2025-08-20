import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
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

  const downloadIndicatorAnalysis = () => {
    if (!results || !data.legalFramework) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Analysis results are not available for download.",
      });
      return;
    }

    // Mock detailed indicator analysis data
    const indicatorData = [
      {
        'Indicator ID': 'IND-001',
        'Indicator Name': 'GHG Emissions Disclosure',
        'Category': 'Environmental',
        'Alignment Level': 'Fully Aligned',
        'Compliance Score': 95,
        'Evidence Found': 'Comprehensive GHG inventory in sustainability report',
        'Gap Analysis': 'No significant gaps identified',
        'Recommendations': 'Continue current reporting practices'
      },
      {
        'Indicator ID': 'IND-002',
        'Indicator Name': 'Supply Chain Due Diligence',
        'Category': 'Social',
        'Alignment Level': 'Mostly Aligned',
        'Compliance Score': 82,
        'Evidence Found': 'Supplier code of conduct and audit procedures',
        'Gap Analysis': 'Limited disclosure on tier 2+ suppliers',
        'Recommendations': 'Expand supplier transparency reporting'
      },
      {
        'Indicator ID': 'IND-003',
        'Indicator Name': 'Board Diversity',
        'Category': 'Governance',
        'Alignment Level': 'Partially Aligned',
        'Compliance Score': 65,
        'Evidence Found': 'Basic diversity statistics reported',
        'Gap Analysis': 'Missing diversity targets and strategy',
        'Recommendations': 'Develop comprehensive diversity strategy with measurable targets'
      },
      {
        'Indicator ID': 'IND-004',
        'Indicator Name': 'Water Management',
        'Category': 'Environmental',
        'Alignment Level': 'Not Aligned',
        'Compliance Score': 25,
        'Evidence Found': 'Limited water usage data',
        'Gap Analysis': 'No water risk assessment or management strategy',
        'Recommendations': 'Implement comprehensive water management framework'
      },
      {
        'Indicator ID': 'IND-005',
        'Indicator Name': 'Employee Training',
        'Category': 'Social',
        'Alignment Level': 'Fully Aligned',
        'Compliance Score': 90,
        'Evidence Found': 'Detailed training programs and metrics',
        'Gap Analysis': 'Minor gaps in accessibility reporting',
        'Recommendations': 'Enhance reporting on training accessibility'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(indicatorData);
    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Analysis Summary', ''],
      ['Project Name', data.project?.name || 'N/A'],
      ['Legal Framework', data.legalFramework.name],
      ['Analysis Date', new Date().toLocaleDateString()],
      ['Overall Compliance Score', `${results.compliance_score}%`],
      ['', ''],
      ['Key Metrics', ''],
      ['Total Indicators', results.results.total_indicators],
      ['Compliant Indicators', results.results.compliant_indicators],
      ['Gaps Identified', results.results.gaps_identified],
      ['Critical Issues', results.results.critical_gaps],
      ['', ''],
      ['AI Recommendations', ''],
      [results.recommendations, '']
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Analysis Summary');
    XLSX.utils.book_append_sheet(wb, ws, 'Indicator Analysis');
    
    // Generate filename
    const filename = `indicator-analysis-${data.project?.name || 'project'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "File downloaded",
      description: "Indicator analysis has been exported to Excel.",
    });
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
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Analysis Complete</h3>
              <p className="text-muted-foreground">Your sustainability framework analysis has been completed successfully.</p>
            </div>
            
            {/* Download button for indicator analysis */}
            <div className="text-center pb-4">
              <Button onClick={downloadIndicatorAnalysis} variant="outline" className="mr-4">
                <Download className="h-4 w-4 mr-2" />
                Download Indicator Analysis (Excel)
              </Button>
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