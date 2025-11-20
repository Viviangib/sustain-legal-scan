import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, FileText, AlertCircle, Info, Loader2 } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';
import * as XLSX from 'xlsx';
import { UnifiedPreviewTable } from './UnifiedPreviewTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NormalizedIndicator {
  indicator_id: string;
  indicator_text: string;
  category?: string;
  subcategory?: string;
  source?: string;
  notes?: string;
}

interface ValidationIssue {
  type: 'duplicate' | 'empty_id' | 'short_text';
  rowIndex: number;
  message: string;
}

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

type UploadMode = 'excel' | 'pdf-word';
type ExtractionStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

export function DocumentUploadStep({ onNext, onPrevious, onDataUpdate, data }: DocumentUploadStepProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>(data.step2FileInfo?.uploadMode || 'excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [indicators, setIndicators] = useState<NormalizedIndicator[]>(data.indicators || []);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  
  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([
    { id: 'upload', label: 'Upload', status: 'pending' },
    { id: 'ocr', label: 'OCR', status: 'pending' },
    { id: 'parse', label: 'Parse', status: 'pending' },
    { id: 'extract', label: 'Extract', status: 'pending' },
    { id: 'validate', label: 'Validate', status: 'pending' },
  ]);

  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Restore file info when coming back to this step
  useEffect(() => {
    if (data.step2FileInfo && !selectedFile) {
      // Create a mock file object to represent the previously uploaded file
      const mockFile = new File([], data.step2FileInfo.fileName, { type: 'application/octet-stream' });
      Object.defineProperty(mockFile, 'size', { value: data.step2FileInfo.fileSize });
      setSelectedFile(mockFile);
    }
  }, []);

  // Persist indicators to parent whenever they change
  useEffect(() => {
    if (indicators.length > 0) {
      onDataUpdate({ indicators });
    }
  }, [indicators]);

  // Timer for extraction
  useEffect(() => {
    let interval: number;
    if (isExtracting) {
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExtracting]);

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

  const validateIndicators = (indicators: NormalizedIndicator[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const seenIds = new Map<string, number>();

    indicators.forEach((ind, idx) => {
      // Check for empty ID
      if (!ind.indicator_id || ind.indicator_id.trim() === '') {
        issues.push({
          type: 'empty_id',
          rowIndex: idx,
          message: 'Indicator ID cannot be empty'
        });
      } else {
        // Check for duplicates
        if (seenIds.has(ind.indicator_id)) {
          issues.push({
            type: 'duplicate',
            rowIndex: idx,
            message: `Duplicate ID: ${ind.indicator_id}`
          });
        } else {
          seenIds.set(ind.indicator_id, idx);
        }
      }

      // Check for short indicator text
      if (!ind.indicator_text || ind.indicator_text.trim().length < 3) {
        issues.push({
          type: 'short_text',
          rowIndex: idx,
          message: 'Indicator text must be at least 3 characters'
        });
      }
    });

    return issues;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // If there are unsaved edits, show confirmation
    if (hasUnsavedEdits && indicators.length > 0) {
      setPendingFile(file);
      setShowReplaceDialog(true);
      return;
    }

    processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setValidationError('');
    setHasUnsavedEdits(false);
    setIndicators([]); // Reset indicators when new file is selected

    // Save file info to parent state
    onDataUpdate({
      step2FileInfo: {
        fileName: file.name,
        fileSize: file.size,
        uploadMode
      },
      indicators: []
    });

    if (uploadMode === 'excel') {
      await parseExcelFile(file);
    }
    // For PDF/Word, wait for user to click "Start extraction"
  };

  const handleStartExtraction = async () => {
    if (selectedFile) {
      await extractFromDocument(selectedFile);
    }
  };

  const parseExcelFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', blankrows: false }) as any[][];

      if (jsonData.length === 0) {
        setValidationError("The Excel file appears to be empty.");
        return;
      }

      if (jsonData.length > 10001) {
        setValidationError("Maximum 10,000 indicators allowed. Your file has too many rows.");
        return;
      }

      const headers = jsonData[0].map(h => String(h).trim()).filter(h => h !== '');
      const validation = hasRequiredHeaders(headers);

      if (!validation.hasId || !validation.hasText) {
        setValidationError("Missing required columns: ID, Indicator text. Map columns to continue.");
        return;
      }

      const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
      
      if (dataRows.length === 0) {
        setValidationError("The Excel file has headers but no data rows.");
        return;
      }

      const parsed = parseIndicators(headers, dataRows, validation.idCol, validation.textCol);
      setIndicators(parsed);
      
      const issues = validateIndicators(parsed);
      setValidationIssues(issues);

      toast({
        title: "Framework loaded",
        description: `${parsed.length} indicators ready for review.`,
      });
    } catch (error) {
      console.error('Excel parsing error:', error);
      setValidationError("Failed to parse Excel file. Ensure it's a valid XLS/XLSX/CSV file.");
    }
  };

  const parseIndicators = (headers: string[], dataRows: any[][], idCol: string, textCol: string): NormalizedIndicator[] => {
    const idIdx = headers.indexOf(idCol);
    const textIdx = headers.indexOf(textCol);
    
    const normalized = headers.map(h => normalizeHeaderName(h));
    const categoryIdx = normalized.findIndex(h => h === 'category');
    const subcategoryIdx = normalized.findIndex(h => h === 'subcategory');
    const sourceIdx = normalized.findIndex(h => h === 'source');
    const notesIdx = normalized.findIndex(h => h === 'notes');

    return dataRows.map(row => ({
      indicator_id: String(row[idIdx] || '').trim(),
      indicator_text: String(row[textIdx] || '').trim(),
      category: categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : '',
      subcategory: subcategoryIdx !== -1 ? String(row[subcategoryIdx] || '').trim() : '',
      source: sourceIdx !== -1 ? String(row[sourceIdx] || '').trim() : '',
      notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() : ''
    }));
  };

  const extractFromDocument = async (file: File) => {
    setIsExtracting(true);
    setElapsedSeconds(0);
    setExtractionProgress(0);
    setIndicators([]);
    
    // Simulate extraction with steps
    const steps = [...extractionSteps];
    
    try {
      // Upload
      steps[0].status = 'running';
      setExtractionSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 500));
      steps[0].status = 'done';
      setExtractionProgress(20);
      setExtractionSteps([...steps]);

      // OCR
      steps[1].status = 'running';
      setExtractionSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 800));
      steps[1].status = 'done';
      setExtractionProgress(40);
      setExtractionSteps([...steps]);

      // Parse
      steps[2].status = 'running';
      setExtractionSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 600));
      steps[2].status = 'done';
      setExtractionProgress(60);
      setExtractionSteps([...steps]);

      // Extract - stream indicators
      steps[3].status = 'running';
      setExtractionSteps([...steps]);
      
      const extracted: NormalizedIndicator[] = [
        { indicator_id: 'E1.1', indicator_text: 'Greenhouse gas emissions (Scope 1)', category: 'Environment', subcategory: 'Emissions', source: 'AI Extracted' },
        { indicator_id: 'E1.2', indicator_text: 'Greenhouse gas emissions (Scope 2)', category: 'Environment', subcategory: 'Emissions', source: 'AI Extracted' },
        { indicator_id: 'S1.1', indicator_text: 'Employee diversity metrics', category: 'Social', subcategory: 'Workforce', source: 'AI Extracted' },
        { indicator_id: 'S1.2', indicator_text: 'Health and safety incident rate', category: 'Social', subcategory: 'Workforce', source: 'AI Extracted' },
        { indicator_id: 'G1.1', indicator_text: 'Board diversity', category: 'Governance', subcategory: 'Leadership', source: 'AI Extracted' },
        { indicator_id: 'E2.1', indicator_text: 'Water consumption', category: 'Environment', subcategory: 'Resources', source: 'AI Extracted' },
        { indicator_id: 'E2.2', indicator_text: 'Waste generated', category: 'Environment', subcategory: 'Resources', source: 'AI Extracted' },
        { indicator_id: 'S2.1', indicator_text: 'Employee training hours', category: 'Social', subcategory: 'Development', source: 'AI Extracted' },
        { indicator_id: 'G1.2', indicator_text: 'Ethics training completion', category: 'Governance', subcategory: 'Compliance', source: 'AI Extracted' },
        { indicator_id: 'E3.1', indicator_text: 'Renewable energy usage', category: 'Environment', subcategory: 'Energy', source: 'AI Extracted' },
      ];

      // Stream indicators
      for (let i = 0; i < extracted.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setIndicators(prev => [...prev, extracted[i]]);
      }

      steps[3].status = 'done';
      setExtractionProgress(80);
      setExtractionSteps([...steps]);

      // Validate
      steps[4].status = 'running';
      setExtractionSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const issues = validateIndicators(extracted);
      setValidationIssues(issues);
      
      steps[4].status = 'done';
      setExtractionProgress(100);
      setExtractionSteps([...steps]);

      toast({
        title: "Extraction complete",
        description: `Found ${extracted.length} indicators. Please review.`,
      });
    } catch (error) {
      console.error('AI extraction error:', error);
      setValidationError("Failed to extract indicators. Try uploading an Excel file instead.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEdit = (index: number, field: keyof NormalizedIndicator, value: string) => {
    const updated = [...indicators];
    updated[index] = { ...updated[index], [field]: value };
    setIndicators(updated);
    setHasUnsavedEdits(true);
    
    // Revalidate
    const issues = validateIndicators(updated);
    setValidationIssues(issues);
  };

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      indicators.map(ind => ({
        'ID': ind.indicator_id,
        'Indicator text': ind.indicator_text,
        'Category': ind.category || '',
        'Subcategory': ind.subcategory || '',
        'Source': ind.source || '',
        'Notes': ind.notes || ''
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Indicators');
    XLSX.writeFile(workbook, 'indicators.xlsx');
    
    toast({
      title: "Downloaded",
      description: "You can edit and re-upload the file on this page.",
    });
  };

  const handleReset = () => {
    if (hasUnsavedEdits) {
      setPendingFile(null);
      setShowReplaceDialog(true);
    } else {
      resetState();
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setIndicators([]);
    setValidationIssues([]);
    setValidationError('');
    setHasUnsavedEdits(false);
    setIsExtracting(false);
    setExtractionProgress(0);
    setElapsedSeconds(0);
    setExtractionSteps(extractionSteps.map(s => ({ ...s, status: 'pending' as const })));
  };

  const handleCancelExtraction = () => {
    setIsExtracting(false);
    resetState();
    toast({
      title: "Extraction cancelled",
      description: "Upload cancelled by user.",
    });
  };

  const handleUseIndicators = () => {
    // Check for blocking errors (empty IDs or short texts)
    const blockingIssues = validationIssues.filter(
      issue => issue.type === 'empty_id' || issue.type === 'short_text'
    );

    if (blockingIssues.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot proceed",
        description: "Please fix empty IDs and short indicator texts before continuing.",
      });
      return;
    }

    // Save to parent state
    onDataUpdate({ 
      document: { 
        indicators,
        filename: selectedFile?.name || 'indicators',
        uploadedAt: new Date().toISOString()
      } 
    });

    onNext();
  };

  const canProceed = () => {
    if (indicators.length === 0) return false;
    
    // Only block on empty IDs and short texts
    const blockingIssues = validationIssues.filter(
      issue => issue.type === 'empty_id' || issue.type === 'short_text'
    );
    
    return blockingIssues.length === 0;
  };

  const acceptedTypes = uploadMode === 'excel' 
    ? '.xlsx,.xls,.csv' 
    : '.pdf,.docx,.doc';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share your sustainability indicators</CardTitle>
          <CardDescription>
            Upload your sustainability indicators in Excel (preferred) or extract from a PDF/Word document. Max size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Segmented Control */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={uploadMode === 'excel' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setUploadMode('excel')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              variant={uploadMode === 'pdf-word' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setUploadMode('pdf-word')}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF / Word
            </Button>
          </div>

          {/* File Chip */}
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {uploadMode === 'excel' ? (
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="replaceFile">
                    <Button variant="outline" size="sm" asChild>
                      <span>Replace</span>
                    </Button>
                  </Label>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Remove
                  </Button>
                </div>
              </div>

              {/* Extraction Progress UI - shown when extracting */}
              {isExtracting && (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting...
                    </Button>
                    <Button 
                      onClick={handleCancelExtraction} 
                      variant="destructive"
                      size="sm"
                      className="w-10 px-2"
                    >
                      X
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Extraction Button - only for PDF/Word mode */}
          {uploadMode === 'pdf-word' && selectedFile && indicators.length === 0 && !isExtracting && (
            <Button 
              onClick={handleStartExtraction} 
              className="w-full"
            >
              Start Extraction
            </Button>
          )}

          {/* Dropzone */}
          {!selectedFile && !isExtracting && (
            <div className="space-y-4">
              {uploadMode === 'excel' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div>
                      <strong>Requirements:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Put headers in row 1.</li>
                        <li>Include columns "ID" and "Indicator text".</li>
                        <li>Both fields required per row. No duplicate IDs.</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {uploadMode === 'pdf-word' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    AI will extract indicators from your document. Please ensure to review the results before proceeding. If you edit the Excel, please re-upload it via the Excel tab.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center space-y-4">
                  <div>
                    {uploadMode === 'excel' ? (
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-primary" />
                    ) : (
                      <FileText className="h-12 w-12 mx-auto mb-3 text-primary" />
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      {uploadMode === 'excel'
                        ? 'Upload your Excel file with sustainability indicators'
                        : 'Upload a PDF or Word document for AI extraction'}
                    </p>
                  </div>

                  <div>
                    <Input
                      type="file"
                      accept={acceptedTypes}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="fileInput"
                    />
                    <Label htmlFor="fileInput">
                      <Button variant="default" className="w-full" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadMode === 'excel' ? 'Upload Excel File' : 'Upload PDF/Word Document'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden replace input */}
          <Input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            id="replaceFile"
          />
        </CardContent>
      </Card>

      {/* Unified Preview Table */}
      {indicators.length > 0 && (
        <UnifiedPreviewTable
          indicators={indicators}
          isExtracting={isExtracting}
          onEdit={handleEdit}
          onDownload={handleDownload}
          onNext={handleUseIndicators}
          validationIssues={validationIssues}
          hasUnsavedEdits={hasUnsavedEdits}
        />
      )}

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between">
        <Button onClick={onPrevious} variant="outline">
          Previous Step
        </Button>
        {indicators.length === 0 ? (
          <Button disabled variant="outline">
            Upload indicators to continue
          </Button>
        ) : !canProceed() ? (
          <Button disabled variant="outline">
            Fix validation issues to continue
          </Button>
        ) : (
          <Button onClick={handleUseIndicators}>
            Continue to Next Step
          </Button>
        )}
      </div>

      {/* Replace/Reset Confirmation Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved edits</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingFile) {
                  processFile(pendingFile);
                  setPendingFile(null);
                } else {
                  resetState();
                }
                setShowReplaceDialog(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}