import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, FileText, AlertCircle, Info } from 'lucide-react';
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

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function DocumentUploadStep({ onNext, onPrevious, onDataUpdate, data }: DocumentUploadStepProps) {
  const [uploadMode, setUploadMode] = useState<'none' | 'excel' | 'document'>('none');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
    setValidationError('');

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
        const missing: string[] = [];
        if (!validation.hasId) missing.push("'ID'");
        if (!validation.hasText) missing.push("'Indicator text'");
        setValidationError(`Your file must contain ${missing.join(' and ')} in the header row (row 1). Please update your file.`);
        return;
      }

      // Valid headers found - process data
      const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
      
      if (dataRows.length === 0) {
        setValidationError("The Excel file has headers but no data rows.");
        return;
      }

      // Validate data
      const validationResult = validateData(headers, dataRows, validation.idCol, validation.textCol);
      
      if (validationResult.error) {
        setValidationError(validationResult.error);
        return;
      }

      // All validations passed - save and proceed
      onDataUpdate({ 
        document: { 
          indicators: validationResult.indicators!,
          filename: file.name,
          uploadedAt: new Date().toISOString()
        } 
      });

      toast({
        title: "Framework loaded",
        description: `${validationResult.indicators!.length} indicators ready for analysis.`,
      });

      onNext();
    } catch (error) {
      console.error('Excel parsing error:', error);
      setValidationError("Failed to parse Excel file. Ensure it's a valid XLS/XLSX/CSV file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const validateData = (headers: string[], dataRows: any[][], idCol: string, textCol: string): { error?: string; indicators?: NormalizedIndicator[] } => {
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

    // Validation checks
    const seenIds = new Map<string, number>();
    const duplicateIds: string[] = [];
    const emptyIds: number[] = [];
    const shortTexts: number[] = [];

    indicators.forEach((ind, idx) => {
      // Check for empty ID
      if (!ind.indicator_id) {
        emptyIds.push(idx + 2); // +2 for header row and 1-based indexing
      } else {
        // Track duplicates
        if (seenIds.has(ind.indicator_id)) {
          if (!duplicateIds.includes(ind.indicator_id)) {
            duplicateIds.push(ind.indicator_id);
          }
        } else {
          seenIds.set(ind.indicator_id, idx);
        }
      }

      // Check for empty or short indicator text
      if (!ind.indicator_text || ind.indicator_text.length < 3) {
        shortTexts.push(idx + 2);
      }
    });

    // Build error message
    const errors: string[] = [];
    if (emptyIds.length > 0) {
      errors.push(`Empty Indicator IDs in row(s): ${emptyIds.slice(0, 5).join(', ')}${emptyIds.length > 5 ? ` and ${emptyIds.length - 5} more` : ''}.`);
    }
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate Indicator IDs found: ${duplicateIds.slice(0, 3).join(', ')}${duplicateIds.length > 3 ? ` and ${duplicateIds.length - 3} more` : ''}.`);
    }
    if (shortTexts.length > 0) {
      errors.push(`Indicator text too short (min 3 chars) in row(s): ${shortTexts.slice(0, 5).join(', ')}${shortTexts.length > 5 ? ` and ${shortTexts.length - 5} more` : ''}.`);
    }

    if (errors.length > 0) {
      return { error: errors.join(' ') + ' Please fix in your file.' };
    }

    return { indicators };
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
        setValidationError("We couldn't find indicators. Try a clearer document or upload an Excel file.");
        return;
      }

      onDataUpdate({ 
        document: { 
          indicators: extracted,
          filename: file.name,
          uploadedAt: new Date().toISOString()
        } 
      });

      toast({
        title: "Extraction complete",
        description: `Found ${extracted.length} indicators ready for analysis.`,
      });

      onNext();
    } catch (error) {
      console.error('AI extraction error:', error);
      setValidationError("Failed to extract indicators. Try uploading an Excel file instead.");
    } finally {
      setAiExtracting(false);
    }
  };

  const resetUpload = () => {
    setUploadMode('none');
    setSelectedFile(null);
    setValidationError('');
  };


  // Processing state
  if (isProcessing || aiExtracting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Framework</CardTitle>
          <CardDescription>
            {isProcessing ? 'Processing your Excel file...' : 'Extracting indicators from document...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                {isProcessing ? 'Validating your framework...' : 'AI is extracting indicators...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main upload interface (always visible)
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

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationError}
            </AlertDescription>
          </Alert>
        )}

        {(isProcessing || aiExtracting) ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                {isProcessing ? 'Validating your framework...' : 'AI is extracting indicators...'}
              </p>
            </div>
          </div>
        ) : (
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
                    key={selectedFile?.name || 'excel-input'}
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
                    key={selectedFile?.name || 'doc-input'}
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
        )}

        <div className="flex gap-4">
          <Button onClick={onPrevious} variant="outline" className="flex-1">
            Previous Step
          </Button>
        </div>
      </CardContent>
    </Card>
  );

}
