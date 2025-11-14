# PDF Reports Feature Documentation

## Overview
The ERP system now includes comprehensive PDF report generation for all major modules. Each module has a "Download Report" button that generates a professional PDF report with all relevant data.

## Available Reports

### 1. Dashboard Report
- **Location**: Dashboard page (purple "Download Report" button in top-right)
- **Content**: 
  - Company information
  - Key Performance Indicators (KPIs)
  - Net Profit/Loss
  - Total Sales Revenue
  - Products in Stock count
  - Total Assets Value
- **Filename**: `Dashboard_Report_YYYY-MM-DD.pdf`

### 2. Buying Management Report
- **Location**: Buying page (purple "Download Report" button in header)
- **Content**:
  - Suppliers list with contact details
  - Purchase orders with amounts and status
  - Summary statistics (total suppliers, orders, purchase value)
- **Filename**: `Buying_Report_YYYY-MM-DD.pdf`

### 3. Selling Management Report
- **Location**: Selling page (purple "Download Report" button in header)
- **Content**:
  - Customers list with contact details
  - Sales orders with amounts and status
  - Summary statistics (total customers, orders, sales value)
- **Filename**: `Selling_Report_YYYY-MM-DD.pdf`

### 4. Assets Management Report
- **Location**: Assets page (purple "Download Report" button in header)
- **Content**:
  - Complete assets inventory
  - Asset categories and values
  - Summary statistics (total assets, active assets, total value)
- **Filename**: `Assets_Report_YYYY-MM-DD.pdf`

### 5. Stock Management Report
- **Location**: Stocks page ("Download PDF Report" button in header)
- **Content**:
  - Complete inventory with SKUs and categories
  - Stock quantities and values
  - Low stock and out-of-stock analysis
- **Filename**: `Stocks_Report_YYYY-MM-DD.pdf`

## Technical Implementation

### Libraries Used
- **jsPDF**: Core PDF generation library
- **jsPDF-autotable**: Table formatting for structured data

### Key Features
- Professional formatting with company branding
- Indian Rupee (₹) currency formatting
- Automatic date stamping
- Summary statistics for each module
- Structured tables with proper styling
- Consistent design across all reports

### File Structure
```
src/
  utils/
    pdfGenerator.js          # Core PDF generation functions
  pages/
    Dashboard.jsx           # Dashboard with PDF button
    Buying.jsx             # Buying module with PDF button
    Selling.jsx            # Selling module with PDF button
    Assets.jsx             # Assets module with PDF button
    Stocks.jsx             # Stocks module with PDF button
```

## Usage Instructions

1. **Navigate** to any module (Dashboard, Buying, Selling, Assets, or Stocks)
2. **Click** the "Download Report" or "Download PDF Report" button
3. **PDF file** will be automatically generated and downloaded to your browser's downloads folder
4. **Reports include** all current data in the system with proper formatting

## Customization Options

### Company Information
Edit the `COMPANY_INFO` object in `src/utils/pdfGenerator.js` to update:
- Company name
- Address
- Phone number
- Email address

### Report Styling
Each report function can be customized for:
- Colors and themes
- Table formatting
- Additional data fields
- Custom branding elements

## Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- No additional plugins required
- PDF files open/download automatically based on browser settings

## Troubleshooting

### Common Issues
1. **PDF not downloading**: Check browser download settings
2. **Missing data**: Ensure modules have data loaded before generating reports
3. **Formatting issues**: Verify currency and date locale settings

### Error Handling
- Reports gracefully handle empty data sets
- Missing fields display as "N/A"
- Automatic fallbacks for undefined values

## Future Enhancements
- Email report functionality
- Scheduled report generation
- Custom date range filtering
- Advanced analytics charts
- Multi-language support