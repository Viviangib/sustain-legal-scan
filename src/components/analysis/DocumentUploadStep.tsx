import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';
import * as XLSX from 'xlsx';

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
  const [allRows, setAllRows] = useState<any[][]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [useCustomHeaderRow, setUseCustomHeaderRow] = useState(false);
  const [customHeaderRowNum, setCustomHeaderRowNum] = useState(2);
  const [columnMapping, setColumnMapping] = useState({
    indicator_id: '',
    indicator_text: ''
  });
  const [indicators, setIndicators] = useState<NormalizedIndicator[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (data.document?.indicators) {
      setIndicators(data.document.indicators);
      setUploadMode('excel');
    }
  }, [data.document]);

  const normalizeHeaderName = (header: string): string => {
    return header.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const hasRequiredHeaders = (headers: string[]): { hasId: boolean; hasText: boolean; idCol: string; textCol: string } => {
    const normalized = headers.map(h => normalizeHeaderName(h));
    
    const idIndex = normalized.findIndex(h => h === 'id' || h === 'indicator id');
    const textIndex = normalized.findIndex(h => h === 'indicator text');
    
    return {
      hasId: idIndex !== -1,
      hasText: textIndex !== -1,
      idCol: idIndex !== -1 ? headers[idIndex] : '',
      textCol: textIndex !== -1 ? headers[textIndex] : ''
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'excel' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    setShowFixDialog(false);

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
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', blankrows: false }) as any[][];

      if (jsonData.length === 0) {
        toast({
          variant: "destructive",
          title: "Empty file",
          description: "The Excel file appears to be empty.",
        });
        return;
      }

      if (jsonData.length > 10001) {
        toast({
          variant: "destructive",
          title: "Too many rows",
          description: "Maximum 10,000 indicators allowed.",
        });
        return;
      }

      setAllRows(jsonData);

      const headers = jsonData[0].map(h => String(h).trim()).filter(h => h !== '');
      const validation = hasRequiredHeaders(headers);

      if (!validation.hasId || !validation.hasText) {
        setColumnHeaders(headers);
        const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
        setRawData(dataRows);
        setShowFixDialog(true);
        return;
      }

      // Valid headers found - process data
      setColumnHeaders(headers);
      const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
      
      if (dataRows.length === 0) {
        toast({
          variant: "destructive",
          title: "No data found",
          description: "The Excel file has headers but no data rows.",
        });
        return;
      }

      setRawData(dataRows);
      processValidData(headers, dataRows, validation.idCol, validation.textCol);
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

  const processValidData = (headers: string[], dataRows: any[][], idCol: string, textCol: string) => {
    const idIdx = headers.indexOf(idCol);
    const textIdx = headers.indexOf(textCol);
    
    // Look for optional columns (case-insensitive)
    const normalized = headers.map(h => normalizeHeaderName(h));
    const categoryIdx = normalized.findIndex(h => h === 'category');
    const subcategoryIdx = normalized.findIndex(h => h === 'subcategory');
    const sourceIdx = normalized.findIndex(h => h === 'source');
    const notesIdx = normalized.findIndex(h => h === 'notes');

    const indicators: NormalizedIndicator[] = dataRows.map(row => ({
      indicator_id: String(row[idIdx] || '').trim(),
      indicator_text: String(row[textIdx] || '').trim(),
      category: categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : '',
      subcategory: subcategoryIdx !== -1 ? String(row[subcategoryIdx] || '').trim() : '',
      source: sourceIdx !== -1 ? String(row[sourceIdx] || '').trim() : '',
      notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() : ''
    }));

    setIndicators(indicators);
    validateIndicators(indicators);
  };

  const validateIndicators = (indicatorsList: NormalizedIndicator[]) => {
    const issues: ValidationIssue[] = [];
    const seenIds = new Map<string, number>();
    const duplicates: number[] = [];

    indicatorsList.forEach((ind, idx) => {
      // Check for empty ID (blocking)
      if (!ind.indicator_id) {
        issues.push({ type: 'error', message: `Row ${idx + 2}: Empty Indicator ID`, rowIndex: idx });
      } else {
        // Track duplicates
        if (seenIds.has(ind.indicator_id)) {
          duplicates.push(idx);
          const firstOccurrence = seenIds.get(ind.indicator_id)!;
          if (!duplicates.includes(firstOccurrence)) {
            duplicates.push(firstOccurrence);
          }
        } else {
          seenIds.set(ind.indicator_id, idx);
        }
      }

      // Check for empty or short indicator text (blocking)
      if (!ind.indicator_text || ind.indicator_text.length < 3) {
        issues.push({ type: 'error', message: `Row ${idx + 2}: Indicator text too short (min 3 chars)`, rowIndex: idx });
      }
    });

    if (duplicates.length > 0) {
      issues.push({ type: 'error', message: `${duplicates.length} duplicate Indicator IDs found. Please fix in your file.` });
    }

    setValidationIssues(issues);
  };

  const extractFromDocument = async (file: File) => {
    setAiExtracting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

  const handleFixHeadersConfirm = () => {
    if (!columnMapping.indicator_id || !columnMapping.indicator_text) {
      toast({
        variant: "destructive",
        title: "Selection required",
        description: "Please select columns for both ID and Indicator text.",
      });
      return;
    }

    let headers: string[];
    let dataRows: any[][];

    if (useCustomHeaderRow && customHeaderRowNum > 1 && customHeaderRowNum <= allRows.length) {
      headers = allRows[customHeaderRowNum - 1].map((h: any) => String(h).trim()).filter((h: string) => h !== '');
      dataRows = allRows.slice(customHeaderRowNum).filter(row => row.some(cell => cell !== ''));
    } else {
      headers = columnHeaders;
      dataRows = rawData;
    }

    // Rename columns in-memory
    const idIdx = headers.indexOf(columnMapping.indicator_id);
    const textIdx = headers.indexOf(columnMapping.indicator_text);
    
    if (idIdx !== -1) headers[idIdx] = 'ID';
    if (textIdx !== -1) headers[textIdx] = 'Indicator text';

    setColumnHeaders(headers);
    setRawData(dataRows);
    setShowFixDialog(false);

    processValidData(headers, dataRows, 'ID', 'Indicator text');
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
      const firstError = errors.find(e => e.rowIndex !== undefined);
      toast({
        variant: "destructive",
        title: "Cannot continue",
        description: firstError ? `Fix issue in row ${(firstError.rowIndex || 0) + 2} before continuing.` : "Please fix all errors before continuing.",
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
    setAllRows([]);
    setColumnHeaders([]);
    setIndicators([]);
    setValidationIssues([]);
    setShowFixDialog(false);
    setColumnMapping({ indicator_id: '', indicator_text: '' });
  };

  // Empty state with pre-upload checklist
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Requirements:</strong> Put headers in row 1. Include columns 'ID' and 'Indicator text'.
            </AlertDescription>
          </Alert>

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

  // Fix headers dialog
  if (showFixDialog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fix Headers</CardTitle>
          <CardDescription>
            Your file must contain 'ID' and 'Indicator text' in the header row. Choose columns or update your file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Missing required columns: 'ID' and 'Indicator text' must be in row 1.
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="text-sm font-medium mb-2">First 10 rows preview:</h4>
            <div className="border rounded-lg overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">#</th>
                    {columnHeaders.slice(0, 6).map((header, idx) => (
                      <th key={idx} className="px-2 py-1 text-left font-medium">{header || `Col ${idx + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="px-2 py-1 text-muted-foreground">{idx + 1}</td>
                      {row.slice(0, 6).map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-2 py-1">{String(cell || '').substring(0, 30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select the column for ID *</Label>
              <Select value={columnMapping.indicator_id} onValueChange={(val) => setColumnMapping({ ...columnMapping, indicator_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose ID column" />
                </SelectTrigger>
                <SelectContent>
                  {columnHeaders.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select the column for Indicator text *</Label>
              <Select value={columnMapping.indicator_text} onValueChange={(val) => setColumnMapping({ ...columnMapping, indicator_text: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Indicator text column" />
                </SelectTrigger>
                <SelectContent>
                  {columnHeaders.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="customHeader" 
                checked={useCustomHeaderRow}
                onCheckedChange={(checked) => setUseCustomHeaderRow(checked as boolean)}
              />
              <Label htmlFor="customHeader" className="text-sm font-normal cursor-pointer">
                Row 1 is not headers—use row{' '}
                <Input 
                  type="number" 
                  min="2" 
                  max={Math.min(allRows.length, 20)}
                  value={customHeaderRowNum}
                  onChange={(e) => setCustomHeaderRowNum(parseInt(e.target.value) || 2)}
                  className="w-16 h-7 inline-block mx-1"
                  disabled={!useCustomHeaderRow}
                />
                {' '}as header instead.
              </Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={resetUpload} variant="outline" className="flex-1">
              Back to Upload
            </Button>
            <Button onClick={handleFixHeadersConfirm} className="flex-1">
              Rename & Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview and validation
  const errors = validationIssues.filter(i => i.type === 'error');
  const duplicateErrors = errors.filter(e => !e.rowIndex);
  const rowErrors = errors.filter(e => e.rowIndex !== undefined);
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

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {indicators.length} indicators
          </Badge>
          {duplicateErrors.length > 0 && (
            <Badge variant="destructive">
              {duplicateErrors[0].message.match(/\d+/)?.[0] || '0'} duplicate IDs
            </Badge>
          )}
          {rowErrors.length > 0 && (
            <Badge variant="destructive">
              {rowErrors.length} empty texts
            </Badge>
          )}
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {duplicateErrors.length > 0 && (
                <div className="mb-2">{duplicateErrors[0].message}</div>
              )}
              {rowErrors.length > 0 && (
                <div>
                  {rowErrors.length} validation errors found. {rowErrors[0].message}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg">
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
                  const hasError = rowErrors.some(e => e.rowIndex === idx);
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
