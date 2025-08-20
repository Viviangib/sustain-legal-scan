import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Download,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  SortAsc,
  SortDesc,
  FileSpreadsheet
} from 'lucide-react';

interface Analysis {
  id: string;
  project_id: string;
  compliance_score: number;
  analysis_status: string;
  created_at: string;
  results: any;
  recommendations: string;
  projects: {
    name: string;
    description?: string;
    sustainability_framework?: string;
    sustainability_version?: string;
  };
  legal_frameworks: {
    name: string;
    version?: string;
  };
}

export function AllAnalyses() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'compliance_score' | 'project_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAllAnalyses();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortAnalyses();
  }, [analyses, searchTerm, statusFilter, sortField, sortOrder]);

  const fetchAllAnalyses = async () => {
    try {
      const { data: analyses, error } = await supabase
        .from('analysis_results')
        .select(`
          *,
          projects!inner(name, description, legal_framework_id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch legal frameworks and extract sustainability framework info
      const analysesWithFrameworks = await Promise.all(
        (analyses || []).map(async (analysis) => {
          let legalFrameworkInfo = { name: 'Unknown Framework', version: 'N/A' };
          
          if (analysis.projects?.legal_framework_id) {
            const { data: framework } = await supabase
              .from('legal_frameworks')
              .select('name, version')
              .eq('id', analysis.projects.legal_framework_id)
              .maybeSingle();
            
            if (framework) {
              legalFrameworkInfo = {
                name: framework.name,
                version: framework.version || 'N/A'
              };
            }
          }

          // Extract sustainability framework info from project description
          const description = analysis.projects?.description || '';
          const frameworkMatch = description.match(/Framework: ([^|]+)/);
          const versionMatch = description.match(/Version: ([^|]+)/);
          
          const sustainabilityFramework = frameworkMatch ? frameworkMatch[1].trim() : 'N/A';
          const sustainabilityVersion = versionMatch ? versionMatch[1].trim() : 'N/A';
          
          return {
            ...analysis,
            projects: {
              ...analysis.projects,
              sustainability_framework: sustainabilityFramework,
              sustainability_version: sustainabilityVersion
            },
            legal_frameworks: legalFrameworkInfo
          };
        })
      );

      setAnalyses(analysesWithFrameworks);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analyses.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAnalyses = () => {
    let filtered = analyses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.legal_frameworks?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.projects?.sustainability_framework?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.analysis_status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'compliance_score':
          aValue = a.compliance_score || 0;
          bValue = b.compliance_score || 0;
          break;
        case 'project_name':
          aValue = a.projects?.name || '';
          bValue = b.projects?.name || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAnalyses(filtered);
  };

  const downloadExcelReport = (analysis: Analysis) => {
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

  const downloadSummaryReport = (analysis: Analysis) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">All Analyses</h1>
                <p className="text-muted-foreground">
                  View and manage all your sustainability framework analyses
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by project name, framework, or sustainability framework..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>
                Analysis Results ({filteredAnalyses.length} of {analyses.length})
              </CardTitle>
              <CardDescription>
                Complete list of your sustainability framework analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analyses found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('project_name')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Project</span>
                            {sortField === 'project_name' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Sustainability Framework</TableHead>
                        <TableHead>Legal Framework</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Date</span>
                            {sortField === 'created_at' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('compliance_score')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Compliance</span>
                            {sortField === 'compliance_score' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Indicators</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnalyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="font-medium">
                            {analysis.projects?.name}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{analysis.projects?.sustainability_framework}</div>
                              <div className="text-muted-foreground text-xs">
                                v{analysis.projects?.sustainability_version}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{analysis.legal_frameworks?.name}</div>
                              <div className="text-muted-foreground text-xs">
                                v{analysis.legal_frameworks?.version}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(analysis.analysis_status)}>
                              {analysis.analysis_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {analysis.analysis_status === 'completed' ? (
                              <Badge className={getComplianceColor(analysis.compliance_score)}>
                                {analysis.compliance_score}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {analysis.analysis_status === 'completed' ? (
                              `${analysis.results?.compliant_indicators || 0}/${analysis.results?.total_indicators || 0}`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {analysis.analysis_status === 'completed' && (
                              <TooltipProvider>
                                <div className="flex justify-end space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => downloadExcelReport(analysis)}
                                        className="h-8 px-2"
                                      >
                                        <FileSpreadsheet className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download Excel Report</p>
                                      <p className="text-xs text-muted-foreground">Detailed indicator analysis with charts</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => downloadSummaryReport(analysis)}
                                        className="h-8 px-2"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download Summary Report</p>
                                      <p className="text-xs text-muted-foreground">Text-based compliance summary</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}