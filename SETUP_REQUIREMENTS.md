# Setup Requirements - What You Need to Make This Work

## Required Data & Configuration

### 1. **Google Service Account Credentials** (Required)

You need to create a Google Service Account to access your Google Sheets:

#### Steps to Get Credentials:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or use existing)
   - Click "Select a project" → "New Project"
   - Name it (e.g., "PDF Form Filler")
   - Click "Create"

3. **Enable Google Sheets API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name it (e.g., "pdf-form-filler")
   - Click "Create and Continue"
   - Skip optional steps, click "Done"

5. **Create and Download Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Choose "JSON" format
   - Download the JSON file (keep it safe!)

6. **Extract Credentials from JSON**
   - Open the downloaded JSON file
   - You need two values:
     - `client_email` - The service account email
     - `private_key` - The private key (keep the quotes and \n characters)

### 2. **Environment Variables** (Required)

Create a `.env.local` file in the project root with:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` must be in quotes
- Keep the `\n` characters (they represent newlines)
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### 3. **Google Sheet with Provider Data** (Required)

You need a Google Sheet containing the data you want to fill into PDFs:

#### Sheet Requirements:
- **First row must be headers** (column names)
- **Each row represents one person/provider**
- **Column names** will be used to map to PDF fields

#### Example Sheet Structure:

| Name | Email | Address | City | State | ZIP | License_Number |
|------|-------|---------|------|-------|-----|----------------|
| Dr. Jane Smith | jane@example.com | 123 Main St | Denver | CO | 80201 | MD12345 |
| Dr. John Doe | john@example.com | 456 Oak Ave | Boulder | CO | 80301 | MD67890 |

#### Share the Sheet:
1. Open your Google Sheet
2. Click "Share" button
3. Paste the **service account email** (from step 1.6)
4. Give it **"Viewer"** access
5. Click "Send"

#### Get Your Sheet ID:
- Your Sheet URL looks like: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Copy everything between `/d/` and `/edit`
- Example: If URL is `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`
- Sheet ID is: `1ABC123xyz`

### 4. **PDF Form Template** (Required)

You need a PDF form with fillable fields:

#### PDF Requirements:
- Must have **fillable form fields** (not just a scanned image)
- Fields can be text fields, checkboxes, dropdowns, etc.
- The app will extract field names automatically
- **Note:** Currently only text fields are filled (checkboxes are excluded)

#### How to Verify Your PDF Has Fillable Fields:
- Open PDF in Adobe Acrobat
- Go to "Tools" → "Prepare Form"
- If you see fields, it's a fillable form
- If not, you may need to create form fields first

### 5. **For Vercel Deployment** (If deploying)

When deploying to Vercel, you need to add the same environment variables:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = (your service account email)
   - `GOOGLE_PRIVATE_KEY` = (your private key with quotes and \n)

## Summary Checklist

- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] Service Account JSON key downloaded
- [ ] `.env.local` file created with credentials
- [ ] Google Sheet created with provider data
- [ ] Google Sheet shared with service account email
- [ ] Sheet ID copied
- [ ] PDF form template ready (with fillable fields)
- [ ] (Optional) Vercel environment variables set

## Quick Test

Once everything is set up:

1. Run `npm run dev`
2. Open http://localhost:3000
3. Upload your PDF form
4. Enter your Google Sheet ID
5. Click "Fetch People Data"
6. Map fields
7. Select a person
8. Click "Fill PDF Form"
9. Download the filled PDF!

## Common Issues

**"Failed to fetch Google Sheets data"**
- ✅ Check that sheet is shared with service account email
- ✅ Verify Sheet ID is correct
- ✅ Check `.env.local` file exists and has correct values
- ✅ Make sure private key has quotes and \n characters

**"Error extracting PDF fields"**
- ✅ Verify PDF has fillable form fields (not just scanned)
- ✅ Try opening PDF in Adobe Acrobat to verify fields exist

**"PDF fields not filling"**
- ✅ Check field mapping is correct
- ✅ Verify data exists in Google Sheet for selected person
- ✅ Some PDF fields may be read-only (can't be filled programmatically)

---

**Need help?** Check `README.md` or `QUICKSTART.md` for more details.

