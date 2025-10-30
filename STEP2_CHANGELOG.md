# Step 2 Enhancement Changelog

## Overview
Step 2 "Sustainability Framework" has been completely rewritten to support Excel indicator uploads with column mapping and AI extraction for PDF/Word documents.

## What Changed

### Modified Files
- `src/components/analysis/DocumentUploadStep.tsx` - Complete rewrite

### No Changes To
- `src/pages/Analysis.tsx` - No modifications
- `src/components/analysis/UploadStep.tsx` - No modifications
- `src/components/analysis/UploadSupportingDocumentsStep.tsx` - No modifications
- `src/components/analysis/FrameworkStep.tsx` - No modifications
- `src/components/analysis/AnalysisStep.tsx` - No modifications
- `src/components/analysis/ResultsStep.tsx` - No modifications
- All other project files - Untouched

## New Features

### 1. Dual Upload Modes
- **Excel Mode**: Direct upload of XLS/XLSX/CSV files with indicator data
- **Document Mode**: Upload PDF/Word files for AI extraction of indicators

### 2. Smart Column Detection
- Auto-detects common column names (ID, indicator_id, code, description, text, etc.)
- Falls back to manual mapping UI if auto-detection fails
- Advanced mapping for optional fields (category, subcategory, source, notes)

### 3. Validation System
- **Required fields**: indicator_id (non-empty), indicator_text (min 3 chars)
- **Row limit**: Maximum 10,000 indicators
- **Duplicate detection**: Warns about duplicate IDs (allows continue with confirmation)
- **Empty field detection**: Blocks continue until fixed

### 4. Preview & Inline Editing
- Scrollable table preview (max height ~320px)
- Inline editing for indicator_id and indicator_text fields
- Real-time validation as users edit
- Summary bar showing total indicators, errors, and warnings

### 5. AI Extraction (Placeholder)
- UI flow implemented for PDF/Word extraction
- Currently uses mock data (3 sample indicators)
- Ready for integration with Lovable AI endpoint

## Data Schema

### Normalized Indicator Format
```typescript
interface NormalizedIndicator {
  indicator_id: string;        // Required
  indicator_text: string;       // Required
  category?: string;            // Optional
  subcategory?: string;         // Optional
  source?: string;              // Optional
  notes?: string;               // Optional
}
```

### Output to Parent Component
```typescript
{
  document: {
    indicators: NormalizedIndicator[],
    filename: string,
    uploadedAt: string
  }
}
```

## File Limits
- Maximum file size: 10MB
- Supported Excel formats: .xls, .xlsx, .csv
- Supported document formats: .pdf, .doc, .docx
- Maximum rows: 10,000 indicators

## UI Flow

### Excel Path
1. User uploads Excel/CSV file
2. System auto-detects columns → Shows mapping UI if needed
3. User confirms/adjusts column mapping
4. Preview table displays with validation
5. User fixes errors (if any) via inline editing
6. User clicks "Use this framework" to proceed

### Document Path (AI Extraction)
1. User uploads PDF/Word file
2. System shows "Extracting indicators..." progress
3. AI extracts indicator data (currently mocked)
4. Preview table displays with validation
5. User reviews/edits extracted data
6. User clicks "Use this framework" to proceed

## Accessibility
- Keyboard navigable dropdowns and table
- Screen reader announcements for errors
- Clear visual error indicators
- Proper ARIA labels

## Performance Considerations
- Client-side Excel parsing (no server call needed)
- Virtualization-ready table structure (handles 10K rows)
- Lazy validation (only validates visible data)

## Future Integration: AI Extraction
To enable real AI extraction, implement an edge function:
1. Accept file upload (PDF/Word)
2. Use Lovable AI to extract structured indicator data
3. Return normalized indicators array
4. Replace mock data in `extractFromDocument()` function

## Testing Checklist
- ✅ Excel with standard headers auto-maps correctly
- ✅ Excel with custom headers requires mapping
- ✅ Duplicate IDs show warning but allow continue
- ✅ Empty fields block continue with error message
- ✅ Inline editing updates validation in real-time
- ✅ File size over 10MB rejected with error
- ✅ Navigation back/forth preserves data
- ✅ AI extraction UI flow works (with mock data)

## Known Limitations
- AI extraction currently returns mock data (3 sample indicators)
- OCR for image-based PDFs not yet implemented
- CSV delimiter auto-detection assumes comma (can be enhanced)

## No Breaking Changes
The component maintains the same props interface:
```typescript
interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}
```

Parent component (`Analysis.tsx`) requires no modifications.
