import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, BarChart3, AlertTriangle, CheckCircle, FileText, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AnalysisData } from '@/pages/Analysis';

interface ResultsStepProps {
  data: AnalysisData;
  onStartNew?: () => void;
  onPrevious?: () => void;
}

export function ResultsStep({ data, onStartNew, onPrevious }: ResultsStepProps) {
  const { toast } = useToast();

  const exportReport = () => {
    const results = data.analysisResults.results;
    const score = data.analysisResults.compliance_score;
    
    // Create report content
    const reportContent = `
SUSTAINABILITY COMPLIANCE ANALYSIS REPORT
========================================

Project: ${data.project?.name}
Legal Framework: ${data.legalFramework?.name}
Document: ${data.document?.original_filename}
Analysis Date: ${new Date(data.analysisResults.created_at).toLocaleDateString()}

COMPLIANCE SCORE: ${score}% - ${getComplianceLabel(score)}

METRICS OVERVIEW
================
Total Indicators: ${results.total_indicators}
Compliant Indicators: ${results.compliant_indicators}
Gaps Identified: ${results.gaps_identified}
Critical Issues: ${results.critical_gaps}

AI RECOMMENDATIONS
==================
${data.analysisResults.recommendations}

FRAMEWORK DETAILS
=================
Name: ${data.legalFramework?.name}
Description: ${data.legalFramework?.description}
Jurisdiction: ${data.legalFramework?.jurisdiction}
Category: ${data.legalFramework?.category}
Effective Date: ${data.legalFramework?.effective_date}

Report generated on ${new Date().toLocaleString()}
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sustainability-analysis-report-${data.project?.name || 'project'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Report downloaded",
      description: "Your detailed analysis report has been downloaded.",
    });
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceLabel = (score: number) => {
    if (score >= 80) return 'High Compliance';
    if (score >= 60) return 'Moderate Compliance';
    return 'Low Compliance';
  };

  if (!data.analysisResults) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No analysis results available</p>
        </CardContent>
      </Card>
    );
  }

  const results = data.analysisResults.results;
  const score = data.analysisResults.compliance_score;

  // Mock alignment data - replace with actual data from analysis results
  const alignmentData = [
    { name: 'Fully Aligned', value: 4, color: '#10B981' },
    { name: 'Mostly Aligned', value: 6, color: '#3B82F6' },
    { name: 'Partially Aligned', value: 3, color: '#F59E0B' },
    { name: 'Not Aligned', value: 2, color: '#EF4444' },
    { name: 'Not Applicable', value: 0, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="font-medium">Sustainability Framework:</p>
              <p className="text-muted-foreground">{data.project?.name}</p>
            </div>
            <div>
              <p className="font-medium">Legal Framework:</p>
              <p className="text-muted-foreground">{data.legalFramework?.name}</p>
            </div>
            <div>
              <p className="font-medium">Document:</p>
              <p className="text-muted-foreground">{data.document?.original_filename}</p>
            </div>
            <div>
              <p className="font-medium">Analysis Date:</p>
              <p className="text-muted-foreground">
                {new Date(data.analysisResults.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Summary Report
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrevious}>
          Previous Step
        </Button>
        <Button variant="outline" onClick={onStartNew}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Start New Analysis
        </Button>
      </div>
    </div>
  );
}