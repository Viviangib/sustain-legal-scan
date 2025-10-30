import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
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
  type: 'duplicate' | 'empty_id' | 'short_text';
  rowIndex: number;
  message: string;
}

interface UnifiedPreviewTableProps {
  indicators: NormalizedIndicator[];
  isExtracting: boolean;
  onEdit: (index: number, field: keyof NormalizedIndicator, value: string) => void;
  onDownload: () => void;
  onReset: () => void;
  validationIssues: ValidationIssue[];
  hasUnsavedEdits: boolean;
}

export function UnifiedPreviewTable({
  indicators,
  isExtracting,
  onEdit,
  onDownload,
  onReset,
  validationIssues,
  hasUnsavedEdits
}: UnifiedPreviewTableProps) {
  const [showValidation, setShowValidation] = useState(true);
  const displayIndicators = isExtracting ? indicators.slice(0, 10) : indicators.slice(0, 10);
  
  const issuesCounts = validationIssues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issuesText = Object.entries(issuesCounts)
    .map(([type, count]) => {
      if (type === 'duplicate') return `${count} duplicates`;
      if (type === 'empty_id') return `${count} empty IDs`;
      if (type === 'short_text') return `${count} short texts`;
      return '';
    })
    .filter(Boolean)
    .join(' • ');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              {isExtracting
                ? 'Preview: first 10 indicators'
                : `Showing 10 of ${indicators.length} indicators`}
            </CardTitle>
            {validationIssues.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="destructive" className="cursor-pointer" onClick={() => setShowValidation(true)}>
                  {issuesText}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationIssues.length > 0 && showValidation && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationIssues.slice(0, 3).map((issue, idx) => (
                  <div key={idx} className="text-sm">
                    Row {issue.rowIndex + 2}: {issue.message}
                  </div>
                ))}
                {validationIssues.length > 3 && (
                  <div className="text-sm">
                    And {validationIssues.length - 3} more issues...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium w-32">ID</th>
                <th className="px-4 py-2 text-left font-medium">Indicator Text</th>
                <th className="px-4 py-2 text-left font-medium w-32">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayIndicators.map((ind, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Input
                      value={ind.indicator_id}
                      onChange={(e) => onEdit(idx, 'indicator_id', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={ind.indicator_text}
                      onChange={(e) => onEdit(idx, 'indicator_text', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={ind.category || ''}
                      onChange={(e) => onEdit(idx, 'category', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {indicators.length > 10 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Showing first 10 of {indicators.length} indicators. All will be included in analysis.
            </AlertDescription>
          </Alert>
        )}

        {hasUnsavedEdits && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have unsaved edits. Download or proceed to save changes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
