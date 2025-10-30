# Step 2: Document Upload Enhancement - Changelog

## Overview
This changelog documents the changes made to **Step 2: "Sustainability Framework"** in the analysis workflow. The enhancement implements **strict header validation** with a user-guided "Fix headers" dialog for non-compliant Excel files.

## Modified Files
- `src/components/analysis/DocumentUploadStep.tsx` - Complete rewrite with strict validation

## No Changes Made To
- Other analysis steps (Step 1, 3, 4, etc.)
- Backend endpoints or API integrations
- Global styles or design system
- Navigation or routing logic
- Authentication or pricing flows

## Key Changes

### 1. Pre-Upload Requirements (Strictly Enforced)
**Required Format**
- Header row **must** be row 1
- Required columns: `ID` and `Indicator text` (case-insensitive, but must be present)
- Optional columns: `Category`, `Subcategory`, `Source`, `Notes`
- File limit: ≤ 10MB, ≤ 10,000 rows

**Pre-Upload Checklist**
- Inline alert visible before upload
- Clear guidance: "Put headers in row 1. Include columns 'ID' and 'Indicator text'."

### 2. Strict Header Validation
**Validation Rules**
- Headers are expected in row 1
- Required columns: `ID` and `Indicator text` must be present
- Case-insensitive matching (e.g., "id", "Id", "ID" all accepted)
- Whitespace normalization (e.g., "Indicator  Text" → "indicator text")
- **Automatic normalization**: Forgives minor casing/spacing issues silently

**Validation Outcomes**
- ✅ **Pass**: Both required columns found → process immediately
- ❌ **Fail**: Missing one or both required columns → show "Fix headers" dialog

### 3. "Fix Headers" Dialog
**Shown When**: Required columns not found in row 1

**Features**
- Preview of first 10 rows
- Two dropdowns to manually select:
  - Column for "ID"
  - Column for "Indicator text"
- Checkbox option: "Row 1 is not headers—use row [n] as header instead"
  - Allows user to specify a different row (2-20) as the header row
  - Adjusts data parsing accordingly
- **One-click Rename**: Applies in-memory column renaming to match requirements
- **No file modification**: Original file remains unchanged

**Actions**
- "Back to Upload" - Cancel and restart
- "Rename & Apply" - Apply mapping and continue to validation

### 4. Validation System (Blocking Errors)
**Duplicate IDs**
- **Trigger**: Same Indicator ID appears multiple times
- **Message**: "X duplicate Indicator IDs found. Please fix in your file."
- **Action**: **Blocks** proceed; user must fix in Excel and re-upload

**Empty Indicator IDs**
- **Trigger**: Any row has empty ID
- **Message**: "Row X: Empty Indicator ID"
- **Action**: **Blocks** proceed; highlights affected row

**Empty/Short Indicator Text**
- **Trigger**: Text field empty or < 3 characters
- **Message**: "Row X: Indicator text too short (min 3 chars)"
- **Action**: **Blocks** proceed; highlights affected row

### 5. Summary Chips (After Validation)
- Displayed as badges above preview table
- Shows: Total indicators, duplicate count, empty text count
- Example: `152 indicators` • `3 duplicate IDs` • `2 empty texts`

### 6. Preview Table
- Compact scrollable table (max height 320px)
- Inline editing for ID and Text fields
- Error rows highlighted in red
- Row numbering starts at 1 (matches Excel)
- Optional columns (Category, Subcategory) shown if present

### 7. Continue/Block Logic
**Can Continue When**:
- All required fields (ID, Text) are non-empty
- All text fields ≥ 3 characters
- Zero validation errors

**Blocked When**:
- Any duplicate IDs exist
- Any empty IDs exist
- Any empty or short (< 3 chars) texts exist

## Data Schema

### Normalized Indicator Structure
```typescript
interface NormalizedIndicator {
  indicator_id: string;      // Required, non-empty
  indicator_text: string;    // Required, min 3 chars
  category?: string;         // Optional
  subcategory?: string;      // Optional
  source?: string;           // Optional
  notes?: string;            // Optional
}
```

### Output Format
```typescript
{
  document: {
    indicators: NormalizedIndicator[],
    filename: string,
    uploadedAt: string  // ISO timestamp
  }
}
```

## Error Messages (User-Facing)

### Missing Required Columns
"Your file must contain 'ID' and 'Indicator text' in the header row. Choose columns now or update your file."

### Duplicate IDs
"3 duplicate Indicator IDs found. Please fix in your file."

### Empty Texts
"2 validation errors found. Row 5: Indicator text too short (min 3 chars)."

## Technical Implementation

### Header Detection Logic
```typescript
// Normalize and match (case-insensitive)
const normalized = header.toLowerCase().trim().replace(/\s+/g, ' ');
const isId = normalized === 'id' || normalized === 'indicator id';
const isText = normalized === 'indicator text';
```

### Custom Header Row Handling
- User can specify row 2-20 as header row
- Data parsing adjusts: `dataRows = allRows.slice(customHeaderRowNum)`
- In-memory only; no file modification

### Optional Column Detection
- After required columns validated, looks for optional columns
- Case-insensitive matching: `category`, `subcategory`, `source`, `notes`
- Gracefully handles missing optional columns

## Testing Checklist

- ✅ Excel with perfect headers ("ID", "Indicator text") → auto-process
- ✅ Excel with case variations ("id", "Indicator Text") → auto-process
- ✅ Excel with missing required columns → show fix dialog
- ✅ Fix dialog: manual column mapping → success
- ✅ Fix dialog: use row 2 as header → success
- ✅ Duplicate IDs → blocking error
- ✅ Empty IDs → blocking error
- ✅ Short text (< 3 chars) → blocking error
- ✅ Summary chips display correct counts
- ✅ Inline editing updates validation in real-time
- ✅ File size > 10MB → rejected
- ✅ Row count > 10,000 → rejected

## Breaking Changes
None. This is a refinement of Step 2's validation logic. Stricter than before, but no other steps affected.

## Future Enhancements
1. Template download button (pre-formatted Excel)
2. Bulk duplicate ID resolution UI
3. CSV delimiter auto-detection improvements
4. Real-time validation as user types in fix dialog
