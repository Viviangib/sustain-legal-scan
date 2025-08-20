import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Plus,
  TrendingUp,
  Shield,
  FileCheck,
  Download,
  Calendar
} from 'lucide-react';

interface RecentAnalysis {
  id: string;
  project_id: string;
  compliance_score: number;
  analysis_status: string;
  created_at: string;
  results: any;
  recommendations: string;
  projects: {
    name: string;
  };
  legal_frameworks: {
    name: string;
  };
}

export function DashboardOverview() {
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      // First, fetch analysis results with projects
      const { data: analyses, error } = await supabase
        .from('analysis_results')
        .select(`
          *,
          projects!inner(name, legal_framework_id)
        `)
        .eq('user_id', user?.id)
        .eq('analysis_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch legal frameworks separately for each analysis
      const analysesWithFrameworks = await Promise.all(
        (analyses || []).map(async (analysis) => {
          if (analysis.projects?.legal_framework_id) {
            const { data: framework } = await supabase
              .from('legal_frameworks')
              .select('name')
              .eq('id', analysis.projects.legal_framework_id)
              .single();
            
            return {
              ...analysis,
              legal_frameworks: {
                name: framework?.name || 'Unknown Framework'
              }
            };
          } else {
            return {
              ...analysis,
              legal_frameworks: {
                name: 'Unknown Framework'
              }
            };
          }
        })
      );

      // Fetch stats
      const { data: allAnalyses, error: statsError } = await supabase
        .from('analysis_results')
        .select('analysis_status')
        .eq('user_id', user?.id);

      if (statsError) throw statsError;

      const total = allAnalyses?.length || 0;
      const completed = allAnalyses?.filter(a => a.analysis_status === 'completed').length || 0;
      const inProgress = allAnalyses?.filter(a => a.analysis_status === 'processing').length || 0;

      setStats({ total, completed, inProgress });
      setRecentAnalyses(analysesWithFrameworks);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load recent analyses.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExcelReport = (analysis: RecentAnalysis) => {
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
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(indicatorData);
    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Analysis Summary', ''],
      ['Project Name', analysis.projects?.name || 'N/A'],
      ['Legal Framework', analysis.legal_frameworks?.name || 'N/A'],
      ['Analysis Date', new Date(analysis.created_at).toLocaleDateString()],
      ['Overall Compliance Score', `${analysis.compliance_score}%`],
      ['', ''],
      ['Key Metrics', ''],
      ['Total Indicators', analysis.results?.total_indicators || 0],
      ['Compliant Indicators', analysis.results?.compliant_indicators || 0],
      ['Gaps Identified', analysis.results?.gaps_identified || 0],
      ['Critical Issues', analysis.results?.critical_gaps || 0],
      ['', ''],
      ['AI Recommendations', ''],
      [analysis.recommendations || 'No recommendations available', '']
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Analysis Summary');
    XLSX.utils.book_append_sheet(wb, ws, 'Indicator Analysis');
    
    // Generate filename
    const filename = `indicator-analysis-${analysis.projects?.name || 'project'}-${new Date(analysis.created_at).toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Excel downloaded",
      description: "Indicator analysis has been exported to Excel.",
    });
  };

  const downloadSummaryReport = (analysis: RecentAnalysis) => {
    const reportContent = `
SUSTAINABILITY COMPLIANCE ANALYSIS REPORT
========================================

Project: ${analysis.projects?.name || 'N/A'}
Legal Framework: ${analysis.legal_frameworks?.name || 'N/A'}
Analysis Date: ${new Date(analysis.created_at).toLocaleDateString()}

COMPLIANCE SCORE: ${analysis.compliance_score}% - ${getComplianceLabel(analysis.compliance_score)}

METRICS OVERVIEW
================
Total Indicators: ${analysis.results?.total_indicators || 0}
Compliant Indicators: ${analysis.results?.compliant_indicators || 0}
Gaps Identified: ${analysis.results?.gaps_identified || 0}
Critical Issues: ${analysis.results?.critical_gaps || 0}

AI RECOMMENDATIONS
==================
${analysis.recommendations || 'No recommendations available'}

Report generated on ${new Date().toLocaleString()}
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sustainability-analysis-report-${analysis.projects?.name || 'project'}-${new Date(analysis.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Summary downloaded",
      description: "Your detailed analysis report has been downloaded.",
    });
  };

  const getComplianceLabel = (score: number) => {
    if (score >= 80) return 'High Compliance';
    if (score >= 60) return 'Moderate Compliance';
    return 'Low Compliance';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <Link to="/analysis">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Start New Analysis
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? 'No analyses yet' : 'Total analyses completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed === 0 ? 'Ready to start analyzing' : 'Successfully completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgress === 0 ? 'No active analyses' : 'Currently processing'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your latest sustainability framework analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analyses yet</p>
              <p className="text-sm">Create your first analysis to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{analysis.projects?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.legal_frameworks?.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getComplianceColor(analysis.compliance_score)}>
                        {analysis.compliance_score}% Compliance
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{analysis.results?.compliant_indicators || 0}/{analysis.results?.total_indicators || 0} indicators</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => downloadExcelReport(analysis)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel Report
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => downloadSummaryReport(analysis)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Summary Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Frameworks Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Legal Frameworks</CardTitle>
          <CardDescription>
            Reference frameworks available for benchmarking your sustainability documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">CS3D</h4>
              <p className="text-sm text-muted-foreground">Corporate Sustainability Due Diligence Directive</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Due Diligence
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">EUDR</h4>
              <p className="text-sm text-muted-foreground">EU Deforestation Regulation</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                  Environmental
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">CSRD</h4>
              <p className="text-sm text-muted-foreground">Corporate Sustainability Reporting Directive</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20">
                  Reporting
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">SFDR</h4>
              <p className="text-sm text-muted-foreground">Sustainable Finance Disclosure Regulation</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Finance
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}