import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export async function generateUserManual(): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title Page
          new Paragraph({
            children: [
              new TextRun({
                text: "SUSTAINABILITY BENCHMARKING TOOL",
                bold: true,
                size: 56,
                color: "2563EB",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "User Manual",
                bold: true,
                size: 40,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Version 1.0",
                size: 24,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                size: 24,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // Table of Contents
          new Paragraph({
            text: "Table of Contents",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({ text: "1. Introduction", spacing: { after: 100 } }),
          new Paragraph({ text: "2. Getting Started", spacing: { after: 100 } }),
          new Paragraph({ text: "   2.1 System Requirements", spacing: { after: 100 } }),
          new Paragraph({ text: "   2.2 Account Registration", spacing: { after: 100 } }),
          new Paragraph({ text: "   2.3 Sign In", spacing: { after: 100 } }),
          new Paragraph({ text: "3. Dashboard Overview", spacing: { after: 100 } }),
          new Paragraph({ text: "4. Creating a New Analysis", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.1 Step 1: Primary Information", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.2 Step 2: Sustainability Indicators", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.3 Step 3: Supporting Documents", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.4 Step 4: Legal Framework Selection", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.5 Step 5: AI Analysis", spacing: { after: 100 } }),
          new Paragraph({ text: "   4.6 Step 6: Summary Report", spacing: { after: 100 } }),
          new Paragraph({ text: "5. Understanding Analysis Results", spacing: { after: 100 } }),
          new Paragraph({ text: "6. Downloading Reports", spacing: { after: 100 } }),
          new Paragraph({ text: "7. Managing Previous Analyses", spacing: { after: 100 } }),
          new Paragraph({ text: "8. Troubleshooting", spacing: { after: 100 } }),
          new Paragraph({ text: "9. Frequently Asked Questions (FAQ)", spacing: { after: 100 } }),
          new Paragraph({ text: "10. Contact & Support", spacing: { after: 400 } }),

          // Section 1: Introduction
          new Paragraph({
            text: "1. Introduction",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The Sustainability Benchmarking Tool is a comprehensive web application designed to help organizations benchmark their sustainability frameworks against international legal frameworks and regulations. This tool leverages AI-powered analysis to identify compliance gaps, provide actionable recommendations, and generate detailed reports.",
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Key Features:",
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Multi-format document upload: ", bold: true }),
              new TextRun({ text: "Support for Excel, PDF, and Word documents containing sustainability indicators" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "AI-powered extraction: ", bold: true }),
              new TextRun({ text: "Automatic extraction of sustainability indicators from PDF and Word documents using OCR and AI" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Legal framework benchmarking: ", bold: true }),
              new TextRun({ text: "Compare your framework against EUDR, CS3D, CSRD, EU Taxonomy, and more" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Comprehensive reports: ", bold: true }),
              new TextRun({ text: "Generate detailed Excel and Word reports with compliance scores and recommendations" }),
            ],
            spacing: { after: 400 },
          }),

          // Section 2: Getting Started
          new Paragraph({
            text: "2. Getting Started",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: "2.1 System Requirements",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Modern web browser (Chrome, Firefox, Safari, or Edge recommended)" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Stable internet connection" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Valid email address for account registration" }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "2.2 Account Registration",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "To create an account:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Navigate to the application login page" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Click on the "Sign Up" tab' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Enter your full name, email address, and create a password (minimum 6 characters)" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '4. Click "Create Account"' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "5. Check your email for a verification link and click to activate your account" }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "2.3 Sign In",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Enter your registered email address and password" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Click "Sign In"' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '3. If you forgot your password, click "Forgot your password?" and follow the email instructions' }),
            ],
            spacing: { after: 400 },
          }),

          // Section 3: Dashboard Overview
          new Paragraph({
            text: "3. Dashboard Overview",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "After signing in, you will be directed to the Dashboard. The dashboard provides:" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Quick Start Card: ", bold: true }),
              new TextRun({ text: 'A prominent "Start New Analysis" button to begin a new sustainability assessment' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Statistics Overview: ", bold: true }),
              new TextRun({ text: "Summary cards showing total analyses, completed analyses, and analyses in progress" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Recent Analyses Table: ", bold: true }),
              new TextRun({ text: "A list of your recent analysis projects with compliance scores, dates, and download options" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Available Legal Frameworks: ", bold: true }),
              new TextRun({ text: "Overview of supported legal frameworks including EUDR, CS3D, CSRD, and EU Taxonomy" }),
            ],
            spacing: { after: 400 },
          }),

          // Section 4: Creating a New Analysis
          new Paragraph({
            text: "4. Creating a New Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "The analysis process consists of 6 sequential steps. Progress is tracked at the top of the page with a visual progress bar." }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.1 Step 1: Primary Information",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Enter basic information about your sustainability framework:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Name: ", bold: true }),
              new TextRun({ text: "The name of your sustainability framework (e.g., FAST-Infra Label)" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Version: ", bold: true }),
              new TextRun({ text: "The version number of your framework (e.g., 1.0)" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Publication Time: ", bold: true }),
              new TextRun({ text: "When the framework was published (e.g., November 2024)" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Standard-Setting Organization: ", bold: true }),
              new TextRun({ text: "The organization that created the framework (e.g., Global Infrastructure Basel Foundation)" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tip: ", bold: true, italics: true }),
              new TextRun({ text: "If you have previously completed an analysis, you can use the \"Auto-fill Form\" option to populate fields from your last analysis.", italics: true }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.2 Step 2: Sustainability Indicators",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Upload your sustainability indicators using one of two methods:" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Option A: Excel/CSV Upload", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Upload an Excel (.xlsx, .xls) or CSV file containing your indicators" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Required columns: "ID" (or "Indicator ID") and "Indicator text"' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Optional columns: "Category", "Subcategory", "Source", "Notes"' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Maximum file size: 10MB, Maximum indicators: 10,000" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Option B: PDF/Word Upload with AI Extraction", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Upload a PDF or Word document (.pdf, .docx, .doc)" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Click "Start Extraction" to begin the AI-powered extraction process' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• The system will perform OCR (if needed), parse the document, extract indicators, and validate them" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Extracted indicators will stream into the preview table as they are identified" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "After upload, you can:", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Review and edit indicators directly in the preview table" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Fix validation issues (empty IDs, duplicate IDs, short indicator text)" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Download indicators as Excel for offline editing and re-upload" }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.3 Step 3: Supporting Documents",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Upload additional context documents to enhance the AI analysis:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Click "Add First Document" or "Add Another Document"' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Provide an optional description for each document" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Supported formats: PDF, Word, Excel, Text files (max 10MB each)" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Examples: Policy guidelines, best practices documents, compliance checklists" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Note: ", bold: true, italics: true }),
              new TextRun({ text: "This step is optional. You can skip it if you don't have additional supporting documents.", italics: true }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.4 Step 4: Legal Framework Selection",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Select the legal framework to benchmark against:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "EUDR: ", bold: true }),
              new TextRun({ text: "EU Deforestation Regulation - Requirements for deforestation-free supply chains" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "CS3D: ", bold: true }),
              new TextRun({ text: "Corporate Sustainability Due Diligence Directive - Human rights and environmental due diligence" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "CSRD: ", bold: true }),
              new TextRun({ text: "Corporate Sustainability Reporting Directive - Comprehensive sustainability reporting standards" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "EU Taxonomy: ", bold: true }),
              new TextRun({ text: "Classification system for environmentally sustainable economic activities" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Each framework displays its category, jurisdiction, and effective date. Click on a framework to select it, then click \"Continue to Analysis\"." }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.5 Step 5: AI Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "The AI analysis process:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Click "Start Analysis" to begin the benchmarking process' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. The analysis typically takes 5-10 minutes - keep the page open during this time" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Progress is displayed with a percentage indicator" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "4. You can cancel the analysis at any time by clicking the X button" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "After completion:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Download the detailed Indicator Analysis Excel file" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• This file contains individual indicator assessments, alignment levels, compliance scores, evidence found, gap analysis, and recommendations" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Important: ", bold: true, italics: true }),
              new TextRun({ text: "Generated files are not permanently saved. Download them before proceeding to the next step.", italics: true }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.6 Step 6: Summary Report",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "The final step presents analysis details and report generation:" }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Click "Generate Summary Report" to create a comprehensive Word document' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Once generated, click "Download Summary Report (Word)" to save the file' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. The report includes:" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   - Project and framework details" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   - Overall compliance score and label" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   - Metrics overview (total indicators, compliant indicators, gaps, critical issues)" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   - AI-generated recommendations" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   - Framework details and effective dates" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'From this step, you can also click "Start New Analysis" to begin a fresh assessment.' }),
            ],
            spacing: { after: 400 },
          }),

          // Section 5: Understanding Analysis Results
          new Paragraph({
            text: "5. Understanding Analysis Results",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Compliance Score Interpretation:", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "80-100% (High Compliance): ", bold: true, color: "16A34A" }),
              new TextRun({ text: "Your framework substantially meets the legal requirements" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "60-79% (Moderate Compliance): ", bold: true, color: "CA8A04" }),
              new TextRun({ text: "Your framework partially meets requirements; some improvements needed" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Below 60% (Low Compliance): ", bold: true, color: "DC2626" }),
              new TextRun({ text: "Significant gaps exist; substantial revisions recommended" }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Indicator Alignment Levels:", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Fully Aligned: ", bold: true }),
              new TextRun({ text: "Indicator completely meets the legal requirement" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Mostly Aligned: ", bold: true }),
              new TextRun({ text: "Indicator substantially meets the requirement with minor gaps" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Partially Aligned: ", bold: true }),
              new TextRun({ text: "Indicator addresses some aspects but has notable gaps" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Not Aligned: ", bold: true }),
              new TextRun({ text: "Indicator does not adequately address the legal requirement" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ text: "Not Applicable: ", bold: true }),
              new TextRun({ text: "The legal requirement is not relevant to this indicator" }),
            ],
            spacing: { after: 400 },
          }),

          // Section 6: Downloading Reports
          new Paragraph({
            text: "6. Downloading Reports",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Two types of reports are available:", bold: true }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Indicator Analysis (Excel)", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   Available from: Step 5 (AI Analysis)" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   Contents: Detailed analysis of each indicator including ID, name, category, alignment level, compliance score, evidence found, gap analysis, and specific recommendations" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Summary Report (Word)", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   Available from: Step 6 (Summary Report) and Dashboard (Recent Analyses)" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   Contents: Executive summary with overall compliance score, key metrics, AI recommendations, and framework details" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Dashboard Downloads:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "From the Dashboard's Recent Analyses table, you can download reports for any completed analysis using the download icons in the Actions column." }),
            ],
            spacing: { after: 400 },
          }),

          // Section 7: Managing Previous Analyses
          new Paragraph({
            text: "7. Managing Previous Analyses",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• View all your analyses in the Dashboard's Recent Analyses table" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Access the complete analysis history by clicking "View All Analyses" link' }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Each analysis shows: Framework name, Legal framework used, Date completed, Compliance score, and Number of indicators analyzed" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Use the Auto-fill feature when starting a new analysis to reuse previous framework information" }),
            ],
            spacing: { after: 400 },
          }),

          // Section 8: Troubleshooting
          new Paragraph({
            text: "8. Troubleshooting",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Common Issues and Solutions:", bold: true }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "File Upload Fails:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Ensure file size is under 10MB" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Verify file format is supported (.xlsx, .xls, .csv, .pdf, .docx, .doc)" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Check your internet connection" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Excel Parsing Error:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Ensure your Excel file has the required columns: "ID" (or "Indicator ID") and "Indicator text"' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Check that the first row contains column headers" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Remove any merged cells or special formatting" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "AI Extraction Issues:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Try uploading an Excel file instead if PDF/Word extraction fails" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Ensure the document text is selectable (not a scanned image without OCR)" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Review and manually correct any incorrectly extracted indicators" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Validation Errors:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Empty ID: Each indicator must have a unique identifier" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Duplicate ID: Edit conflicting IDs to make them unique" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Short Text: Indicator text must be at least 3 characters" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Analysis Taking Too Long:", bold: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Normal analysis takes 5-10 minutes" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Keep the browser tab open and active" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• If stuck for more than 15 minutes, cancel and restart the analysis" }),
            ],
            spacing: { after: 400 },
          }),

          // Section 9: Frequently Asked Questions (FAQ)
          new Paragraph({
            text: "9. Frequently Asked Questions (FAQ)",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // FAQ 1
          new Paragraph({
            children: [
              new TextRun({ text: "Q: What file formats are supported for uploading sustainability indicators?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: The tool supports Excel files (.xlsx, .xls), CSV files, PDF documents, and Word documents (.docx, .doc). For structured data, Excel/CSV is recommended. For unstructured documents, the AI extraction feature can parse PDF and Word files." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 2
          new Paragraph({
            children: [
              new TextRun({ text: "Q: How long does the AI analysis take?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: Analysis time depends on the number of indicators and the complexity of the legal frameworks selected. Typically, an analysis with 50-100 indicators takes 5-10 minutes. Larger datasets may take longer. Please keep your browser tab open during analysis." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 3
          new Paragraph({
            children: [
              new TextRun({ text: "Q: Can I edit indicators after uploading them?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: Yes, you can edit indicators directly in the preview table after upload. Click on any cell to modify its content. You can also download the indicators as Excel, make edits offline, and re-upload the modified file." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 4
          new Paragraph({
            children: [
              new TextRun({ text: "Q: What legal frameworks can I benchmark against?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: The tool currently supports EUDR (EU Deforestation Regulation), CS3D (Corporate Sustainability Due Diligence Directive), CSRD (Corporate Sustainability Reporting Directive), and EU Taxonomy. You can select one or multiple frameworks for comparison." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 5
          new Paragraph({
            children: [
              new TextRun({ text: "Q: How is the compliance score calculated?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: The compliance score is calculated using AI analysis that compares your sustainability indicators against the requirements of the selected legal frameworks. Scores of 80% and above indicate strong alignment, 50-79% indicates partial compliance, and below 50% suggests significant gaps that need attention." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 6
          new Paragraph({
            children: [
              new TextRun({ text: "Q: Can I download and share the analysis results?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: Yes, you can download results in multiple formats including Excel reports with detailed indicator mappings and Word documents with summary reports. These can be shared with stakeholders or used for compliance documentation." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 7
          new Paragraph({
            children: [
              new TextRun({ text: "Q: What happens if the AI extraction misses some indicators?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: AI extraction works best with well-structured documents. If indicators are missed, you can manually add them in the preview table or prepare an Excel file with all indicators. Complex layouts, scanned images without OCR, or unusual formatting may affect extraction accuracy." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 8
          new Paragraph({
            children: [
              new TextRun({ text: "Q: Is my data secure?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: Yes, all uploaded documents and analysis data are stored securely and associated with your user account. Only you can access your analyses. Data is transmitted over encrypted connections (HTTPS) and stored in secure cloud infrastructure." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 9
          new Paragraph({
            children: [
              new TextRun({ text: "Q: Can I re-run an analysis with different legal frameworks?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: Yes, you can create a new analysis using the same sustainability indicators and select different legal frameworks. Your previous analyses are saved and can be accessed from the \"All Analyses\" page for comparison." }),
            ],
            spacing: { after: 200 },
          }),

          // FAQ 10
          new Paragraph({
            children: [
              new TextRun({ text: "Q: What should I do if the analysis fails or gets stuck?", bold: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "A: If analysis fails, try refreshing the page and restarting. Ensure you have a stable internet connection and your indicators are properly formatted. If issues persist, try reducing the number of indicators or contact support for assistance." }),
            ],
            spacing: { after: 400 },
          }),

          // Section 10: Contact & Support
          new Paragraph({
            text: "10. Contact & Support",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "For technical support or questions about the Sustainability Benchmarking Tool, please contact your system administrator or the development team." }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "This tool is part of a project supported by the ISEAL Innovations Fund.", italics: true }),
            ],
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(50),
                color: "CCCCCC",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "© 2024 Sustainability Benchmarking Tool. All rights reserved.",
                size: 20,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Sustainability-Benchmarking-Tool-User-Manual-${new Date().toISOString().split('T')[0]}.docx`);
}
