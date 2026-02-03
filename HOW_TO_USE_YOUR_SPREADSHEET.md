# How to Use Your Spreadsheet

## Quick Guide: Using Your Spreadsheet in the App

### Step 1: Prepare Your Spreadsheet

Your spreadsheet should look like this:

**CSV or Excel Format:**
```
Name,Email,Address,City,State,ZIP,License_Number
Dr. Jane Smith,jane@example.com,123 Main St,Denver,CO,80201,MD12345
Dr. John Doe,john@example.com,456 Oak Ave,Boulder,CO,80301,MD67890
```

**Requirements:**
- ✅ First row = Column headers (Name, Email, etc.)
- ✅ Each row = One person/provider
- ✅ Save as CSV (.csv) or Excel (.xlsx, .xls)

### Step 2: Run the Application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 3: Upload Your Spreadsheet

1. **Upload your PDF form first** (left side)
2. **Click "📄 Upload File"** button (right side - it's the default)
3. **Click "Choose File"** or drag and drop
4. **Select your CSV or Excel file**
5. The app will automatically load your data!

### Step 4: Use Your Data

- Select a person from the dropdown
- Map PDF fields to your spreadsheet columns
- Fill and download the PDF!

## Creating Your Spreadsheet

### Option 1: Export from Google Sheets
1. Open your Google Sheet
2. File → Download → Comma Separated Values (.csv)
3. Use that CSV file in the app

### Option 2: Create in Excel
1. Open Excel
2. Add headers in row 1
3. Add data in rows below
4. File → Save As → CSV (or keep as .xlsx)

### Option 3: Create from Scratch
1. Create a new file
2. First row: `Name,Email,Address,City,State,ZIP`
3. Add data rows below
4. Save as CSV

## Example Spreadsheet Structure

Here's what your file should look like:

| Name | Email | Address | City | State | ZIP | License_Number | NPI |
|------|-------|---------|------|-------|-----|----------------|-----|
| Dr. Jane Smith | jane@example.com | 123 Main St | Denver | CO | 80201 | MD12345 | 1234567890 |
| Dr. John Doe | john@example.com | 456 Oak Ave | Boulder | CO | 80301 | MD67890 | 0987654321 |

**Save this as:** `providers.csv` or `providers.xlsx`

## Tips

- **Column names** should match what you want to fill in PDFs
- **Use clear names**: "First_Name" is better than "FN"
- **No spaces in column names** (use underscores: "First_Name" not "First Name")
- **Empty cells are OK** - they'll just be left blank in the PDF

## Troubleshooting

**"No headers found"**
- Make sure first row has column names
- Check that file isn't empty

**"Failed to parse spreadsheet"**
- Make sure file is CSV or Excel format
- Try saving as CSV from Excel/Google Sheets

**Data not showing up**
- Check that file has data rows (not just headers)
- Verify file format is correct

---

**That's it!** Just upload your file and start filling PDFs. No setup needed! 🚀

