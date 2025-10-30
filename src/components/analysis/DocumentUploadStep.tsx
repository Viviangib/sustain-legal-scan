import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';
import * as XLSX from 'xlsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NormalizedIndicator {
  indicator_id: string;
  indicator_text: string;
  category?: string;
  subcategory?: string;
  source?: string;
  notes?: string;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  rowIndex?: number;
}

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function DocumentUploadStep({ onNext, onPrevious, onDataUpdate, data }: DocumentUploadStepProps) {
  const [uploadMode, setUploadMode] = useState<'none' | 'excel' | 'document'>('none');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    indicator_id: '',
    indicator_text: '',
    category: '',
    subcategory: '',
    source: '',
    notes: ''
  });
  const [indicators, setIndicators] = useState<NormalizedIndicator[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Restore state when navigating back
  useEffect(() => {
    if (data.document?.indicators) {
      setIndicators(data.document.indicators);
      setUploadMode('excel');
    }
  }, [data.document]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'excel' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }

    setSelectedFile(file);
    setUploadMode(mode);
    setRawData([]);
    setColumnHeaders([]);
    setIndicators([]);
    setValidationIssues([]);

    if (mode === 'excel') {
      await parseExcelFile(file);
    } else {
      await extractFromDocument(file);
    }
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];

      if (jsonData.length === 0) {
        toast({
          variant: "destructive",
          title: "Empty file",
          description: "The Excel file appears to be empty.",
        });
        return;
      }

      if (jsonData.length > 10001) { // +1 for header
        toast({
          variant: "destructive",
          title: "Too many rows",
          description: "Maximum 10,000 indicators allowed. File has more rows.",
        });
        return;
      }

      const headers = jsonData[0].map(h => String(h).trim());
      const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

      setColumnHeaders(headers);
      setRawData(dataRows);

      // Try auto-mapping
      const autoMapping = autoDetectColumns(headers);
      if (autoMapping.indicator_id && autoMapping.indicator_text) {
        setColumnMapping(autoMapping);
        applyMapping(headers, dataRows, autoMapping);
      } else {
        setShowMapping(true);
      }
    } catch (error) {
      console.error('Excel parsing error:', error);
      toast({
        variant: "destructive",
        title: "Parse error",
        description: "Failed to parse Excel file. Ensure it's a valid XLS/XLSX/CSV file.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const autoDetectColumns = (headers: string[]): typeof columnMapping => {
    const mapping = {
      indicator_id: '',
      indicator_text: '',
      category: '',
      subcategory: '',
      source: '',
      notes: ''
    };

    const lowerHeaders = headers.map(h => h.toLowerCase());

    // Detect ID column
    const idPatterns = ['indicator_id', 'id', 'indicator id', 'code', 'indicator code', 'ref'];
    for (const pattern of idPatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) {
        mapping.indicator_id = headers[idx];
        break;
      }
    }

    // Detect text/description column
    const textPatterns = ['indicator_text', 'text', 'indicator text', 'description', 'indicator', 'title', 'name'];
    for (const pattern of textPatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) {
        mapping.indicator_text = headers[idx];
        break;
      }
    }

    // Detect optional columns
    const categoryIdx = lowerHeaders.findIndex(h => h.includes('category') && !h.includes('sub'));
    if (categoryIdx !== -1) mapping.category = headers[categoryIdx];

    const subcategoryIdx = lowerHeaders.findIndex(h => h.includes('subcategory') || h.includes('sub-category') || h.includes('sub category'));
    if (subcategoryIdx !== -1) mapping.subcategory = headers[subcategoryIdx];

    const sourceIdx = lowerHeaders.findIndex(h => h.includes('source'));
    if (sourceIdx !== -1) mapping.source = headers[sourceIdx];

    const notesIdx = lowerHeaders.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('remark'));
    if (notesIdx !== -1) mapping.notes = headers[notesIdx];

    return mapping;
  };

  const applyMapping = (headers: string[], dataRows: any[][], mapping: typeof columnMapping) => {
    const idIdx = headers.indexOf(mapping.indicator_id);
    const textIdx = headers.indexOf(mapping.indicator_text);
    const categoryIdx = mapping.category ? headers.indexOf(mapping.category) : -1;
    const subcategoryIdx = mapping.subcategory ? headers.indexOf(mapping.subcategory) : -1;
    const sourceIdx = mapping.source ? headers.indexOf(mapping.source) : -1;
    const notesIdx = mapping.notes ? headers.indexOf(mapping.notes) : -1;

    const normalized: NormalizedIndicator[] = dataRows.map(row => ({
      indicator_id: String(row[idIdx] || '').trim(),
      indicator_text: String(row[textIdx] || '').trim(),
      category: categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : '',
      subcategory: subcategoryIdx !== -1 ? String(row[subcategoryIdx] || '').trim() : '',
      source: sourceIdx !== -1 ? String(row[sourceIdx] || '').trim() : '',
      notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() : ''
    }));

    setIndicators(normalized);
    validateIndicators(normalized);
    setShowMapping(false);
  };

  const validateIndicators = (indicatorsList: NormalizedIndicator[]) => {
    const issues: ValidationIssue[] = [];
    const seenIds = new Set<string>();
    let duplicateCount = 0;
    let emptyIdCount = 0;
    let emptyTextCount = 0;

    indicatorsList.forEach((ind, idx) => {
      if (!ind.indicator_id) {
        emptyIdCount++;
        issues.push({ type: 'error', message: `Row ${idx + 1}: Empty Indicator ID`, rowIndex: idx });
      } else if (seenIds.has(ind.indicator_id)) {
        duplicateCount++;
      } else {
        seenIds.add(ind.indicator_id);
      }

      if (!ind.indicator_text || ind.indicator_text.length < 3) {
        emptyTextCount++;
        issues.push({ type: 'error', message: `Row ${idx + 1}: Indicator text too short (min 3 chars)`, rowIndex: idx });
      }
    });

    if (duplicateCount > 0) {
      issues.push({ type: 'warning', message: `${duplicateCount} duplicate Indicator IDs found. You can continue, but duplicates might affect analysis.` });
    }

    setValidationIssues(issues);
  };

  const extractFromDocument = async (file: File) => {
    setAiExtracting(true);
    try {
      // Simulate AI extraction - in production, call Lovable AI endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data
      const extracted: NormalizedIndicator[] = [
        { indicator_id: 'E1.1', indicator_text: 'Greenhouse gas emissions (Scope 1)', category: 'Environment', subcategory: 'Emissions', source: 'AI Extracted', notes: '' },
        { indicator_id: 'E1.2', indicator_text: 'Greenhouse gas emissions (Scope 2)', category: 'Environment', subcategory: 'Emissions', source: 'AI Extracted', notes: '' },
        { indicator_id: 'S1.1', indicator_text: 'Employee diversity metrics', category: 'Social', subcategory: 'Workforce', source: 'AI Extracted', notes: '' },
      ];

      if (extracted.length === 0) {
        toast({
          variant: "destructive",
          title: "No indicators found",
          description: "We couldn't find indicators. Try a clearer document or upload an Excel file.",
        });
        return;
      }

      setIndicators(extracted);
      validateIndicators(extracted);
      setColumnHeaders(['indicator_id', 'indicator_text', 'category', 'subcategory', 'source', 'notes']);
      
      toast({
        title: "Extraction complete",
        description: `Found ${extracted.length} indicators. Review and edit as needed.`,
      });
    } catch (error) {
      console.error('AI extraction error:', error);
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: "Failed to extract indicators. Try uploading an Excel file instead.",
      });
    } finally {
      setAiExtracting(false);
    }
  };

  const handleMappingConfirm = () => {
    if (!columnMapping.indicator_id || !columnMapping.indicator_text) {
      toast({
        variant: "destructive",
        title: "Mapping incomplete",
        description: "Please map both Indicator ID and Indicator Text fields.",
      });
      return;
    }
    applyMapping(columnHeaders, rawData, columnMapping);
  };

  const handleIndicatorEdit = (index: number, field: keyof NormalizedIndicator, value: string) => {
    const updated = [...indicators];
    updated[index] = { ...updated[index], [field]: value };
    setIndicators(updated);
    validateIndicators(updated);
  };

  const handleContinue = () => {
    const errors = validationIssues.filter(issue => issue.type === 'error');
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Please fix errors",
        description: `${errors.length} validation errors must be fixed before continuing.`,
      });
      return;
    }

    onDataUpdate({ 
      document: { 
        indicators,
        filename: selectedFile?.name || 'Unknown',
        uploadedAt: new Date().toISOString()
      } 
    });

    toast({
      title: "Framework saved",
      description: `${indicators.length} indicators ready for analysis.`,
    });

    onNext();
  };

  const resetUpload = () => {
    setUploadMode('none');
    setSelectedFile(null);
    setRawData([]);
    setColumnHeaders([]);
    setIndicators([]);
    setValidationIssues([]);
    setShowMapping(false);
  };

  // Render empty state
  if (uploadMode === 'none') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Framework</CardTitle>
          <CardDescription>
            Upload your framework file (Excel preferred) or let AI extract from PDF/Word. Max 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-6">
              <div>
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your framework file. Excel works best. You can also upload a PDF/Word and let AI extract indicators.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={(e) => handleFileSelect(e, 'excel')}
                    className="hidden"
                    id="excelInput"
                    disabled={isProcessing}
                  />
                  <Label htmlFor="excelInput">
                    <Button variant="default" className="w-full" asChild disabled={isProcessing}>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Excel (XLS/XLSX/CSV)
                      </span>
                    </Button>
                  </Label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect(e, 'document')}
                    className="hidden"
                    id="docInput"
                    disabled={isProcessing || aiExtracting}
                  />
                  <Label htmlFor="docInput">
                    <Button variant="outline" className="w-full" asChild disabled={isProcessing || aiExtracting}>
                      <span>
                        <FileText className="mr-2 h-4 w-4" />
                        Upload PDF/Word for AI extraction
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={onPrevious} variant="outline" className="flex-1">
              Previous Step
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render column mapping UI
  if (showMapping) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Columns</CardTitle>
          <CardDescription>
            Map the required fields so we know which columns contain indicator IDs and texts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Indicator ID *</Label>
              <Select value={columnMapping.indicator_id} onValueChange={(val) => setColumnMapping({ ...columnMapping, indicator_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column for Indicator ID" />
                </SelectTrigger>
                <SelectContent>
                  {columnHeaders.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Indicator Text *</Label>
              <Select value={columnMapping.indicator_text} onValueChange={(val) => setColumnMapping({ ...columnMapping, indicator_text: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column for Indicator Text" />
                </SelectTrigger>
                <SelectContent>
                  {columnHeaders.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Collapsible open={showAdvancedMapping} onOpenChange={setShowAdvancedMapping}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm">Advanced (optional)</span>
                  {showAdvancedMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={columnMapping.category} onValueChange={(val) => setColumnMapping({ ...columnMapping, category: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {columnHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={columnMapping.subcategory} onValueChange={(val) => setColumnMapping({ ...columnMapping, subcategory: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {columnHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={columnMapping.source} onValueChange={(val) => setColumnMapping({ ...columnMapping, source: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {columnHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Select value={columnMapping.notes} onValueChange={(val) => setColumnMapping({ ...columnMapping, notes: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {columnHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex gap-4">
            <Button onClick={resetUpload} variant="outline" className="flex-1">
              Back to Upload
            </Button>
            <Button onClick={handleMappingConfirm} className="flex-1">
              Apply Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render preview and validation
  const errors = validationIssues.filter(i => i.type === 'error');
  const warnings = validationIssues.filter(i => i.type === 'warning');
  const canContinue = errors.length === 0 && indicators.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Review Framework Indicators</CardTitle>
            <CardDescription>
              {selectedFile?.name} • {indicators.length} indicators detected
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetUpload}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {aiExtracting && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Extracting indicators from document...</AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{warnings[0].message}</AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errors.length} validation errors found. Fix issues before continuing.
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg">
          <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span>Total: <strong>{indicators.length}</strong></span>
              {errors.length > 0 && <span className="text-destructive">Errors: <strong>{errors.length}</strong></span>}
              {warnings.length > 0 && <span className="text-yellow-600">Warnings: <strong>{warnings.length}</strong></span>}
            </div>
          </div>

          <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">#</th>
                  <th className="px-4 py-2 text-left font-medium">Indicator ID</th>
                  <th className="px-4 py-2 text-left font-medium">Indicator Text</th>
                  {indicators.some(i => i.category) && <th className="px-4 py-2 text-left font-medium">Category</th>}
                  {indicators.some(i => i.subcategory) && <th className="px-4 py-2 text-left font-medium">Subcategory</th>}
                </tr>
              </thead>
              <tbody>
                {indicators.map((indicator, idx) => {
                  const hasError = errors.some(e => e.rowIndex === idx);
                  return (
                    <tr key={idx} className={hasError ? 'bg-destructive/10' : idx % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <Input
                          value={indicator.indicator_id}
                          onChange={(e) => handleIndicatorEdit(idx, 'indicator_id', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={indicator.indicator_text}
                          onChange={(e) => handleIndicatorEdit(idx, 'indicator_text', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      {indicators.some(i => i.category) && (
                        <td className="px-4 py-2 text-muted-foreground">{indicator.category}</td>
                      )}
                      {indicators.some(i => i.subcategory) && (
                        <td className="px-4 py-2 text-muted-foreground">{indicator.subcategory}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={onPrevious} variant="outline" className="flex-1">
            Previous Step
          </Button>
          <Button onClick={handleContinue} className="flex-1" disabled={!canContinue || isProcessing || aiExtracting}>
            {canContinue ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Use this framework
              </>
            ) : (
              'Fix issues to continue'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
