import * as XLSX from 'xlsx';

interface ExportIndicator {
  indicator_id: string;
  indicator_text: string;
  category?: string;
  subcategory?: string;
  source?: string;
  notes?: string;
}

export function exportIndicatorsToExcel(indicators: ExportIndicator[], originalFilename: string): void {
  // Prepare data for Excel
  const exportData = indicators.map(indicator => ({
    'Indicator ID': indicator.indicator_id || '',
    'Indicator Text': indicator.indicator_text || '',
    'Category': indicator.category || '',
    'Subcategory': indicator.subcategory || '',
    'Source': indicator.source || '',
    'Notes': indicator.notes || ''
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Indicators');

  // Set column widths for better readability
  const columnWidths = [
    { wch: 15 }, // Indicator ID
    { wch: 50 }, // Indicator Text
    { wch: 20 }, // Category
    { wch: 20 }, // Subcategory
    { wch: 20 }, // Source
    { wch: 30 }  // Notes
  ];
  worksheet['!cols'] = columnWidths;

  // Generate filename
  const baseFilename = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension
  const filename = `${baseFilename}-indicators.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, filename);
}
