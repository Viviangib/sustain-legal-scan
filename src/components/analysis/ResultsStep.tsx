import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, BarChart3, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface ResultsStepProps {
  data: AnalysisData;
  onStartNew?: () => void;
}

export function ResultsStep({ data, onStartNew }: ResultsStepProps) {
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

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Compliance Score</span>
          </CardTitle>
          <CardDescription>
            Overall compliance with {data.legalFramework?.name} requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getComplianceColor(score)}`}>
              {score}%
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {getComplianceLabel(score)}
            </Badge>
            <Progress value={score} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{results.total_indicators}</p>
                <p className="text-sm text-muted-foreground">Total Indicators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{results.compliant_indicators}</p>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{results.gaps_identified}</p>
                <p className="text-sm text-muted-foreground">Gaps Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{results.critical_gaps}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Specific actions to improve your compliance score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm">
              {data.analysisResults.recommendations}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={exportReport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Detailed Report
            </Button>
            <Button variant="outline" className="flex-1" onClick={onStartNew}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Start New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Project:</p>
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
        </CardContent>
      </Card>
    </div>
  );
}