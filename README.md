# PDF Form Filler - Fountain Provider Onboarding

A Next.js application that automatically fills PDF forms with data from Google Sheets. Built specifically for Fountain's provider onboarding process.

## Features

✅ Upload PDF form templates  
✅ Extract form fields automatically  
✅ Connect to Google Sheets for people data  
✅ Visual field mapping interface  
✅ Automatic form filling (text fields only, checkboxes excluded)  
✅ Download filled PDFs instantly  
✅ Pink/Blue Fountain branding

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account
- A Google Sheet with your people/provider data

## Installation

1. **Clone/Download this project**

2. **Install dependencies:**
```bash
npm install
```

3. **Set up Google Sheets API**

### Google Sheets Setup (Important!)

You need to create a Google Service Account to access Google Sheets:

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Name it something like "PDF Form Filler"

#### Step 2: Enable Google Sheets API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

#### Step 3: Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Give it a name like "pdf-form-filler"
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

#### Step 4: Create Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON" format
5. Download the JSON file (keep it safe!)

#### Step 5: Share Your Google Sheet
1. Open the JSON file you downloaded
2. Copy the `client_email` value (looks like: `xxx@xxx.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click "Share"
5. Paste the service account email
6. Give it "Viewer" access
7. Click "Send"

#### Step 6: Set Environment Variables
1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and fill in:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The `client_email` from your JSON file
   - `GOOGLE_PRIVATE_KEY`: The `private_key` from your JSON file (keep the quotes and newlines)

Example `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=pdf-filler@my-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

## Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### 1. Upload Your PDF Form
- Click "Choose File" and select your PDF form (like "Belmar Form (MD).pdf")
- The app will automatically extract all text fields
- Checkboxes and radio buttons are excluded as requested

### 2. Connect Your Google Sheet
- Get your Google Sheet ID from the URL:
  - URL: `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`
  - Sheet ID: `1ABC123xyz`
- Paste the Sheet ID into the input field
- Click "Fetch People Data"

### 3. Map Fields
- The app shows all PDF fields on the left
- Match each PDF field to the corresponding column in your Google Sheet
- You can skip fields by leaving them unmapped

### 4. Fill the Form
- Select a person from the dropdown
- Review their data
- Click "Fill PDF Form"
- Download the completed PDF!

## Google Sheet Format

Your Google Sheet should have headers in the first row. Example:

| Name | Email | Address | City | State | ZIP |
|------|-------|---------|------|-------|-----|
| Dr. Jane Smith | jane@example.com | 123 Main St | Denver | CO | 80201 |
| Dr. John Doe | john@example.com | 456 Oak Ave | Boulder | CO | 80301 |

The column headers will appear in the mapping dropdown so you can match them to PDF fields.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. Deploy!

## Project Structure

```
pdf-form-filler/
├── app/
│   ├── api/
│   │   ├── extract-fields/  # Extract fields from PDF
│   │   ├── fill-pdf/        # Fill PDF with data
│   │   └── sheets/          # Fetch Google Sheets data
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main UI
├── .env.local               # Environment variables (create this)
├── .env.example             # Template for environment variables
├── package.json             # Dependencies
└── README.md               # This file
```

## Troubleshooting

### "Failed to fetch Google Sheets data"
- Make sure you've shared the sheet with the service account email
- Verify your environment variables are correct
- Check that the Sheet ID is correct

### "Error extracting PDF fields"
- Make sure the PDF has form fields (not just a scanned image)
- Try opening the PDF in Adobe Acrobat to verify it has fillable fields

### PDF fields not filling
- Check that the field mapping is correct
- Verify the data exists in your Google Sheet
- Some PDFs have read-only fields that can't be filled programmatically

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF Processing:** pdf-lib
- **Data Source:** Google Sheets API (googleapis)

## Future Enhancements

- [ ] Bulk fill multiple PDFs at once
- [ ] Save field mapping templates
- [ ] Support for multiple PDF templates
- [ ] Checkbox/radio button support (if needed)
- [ ] Export to Google Drive directly

## License

MIT

---

Built with ❤️ for Fountain Provider Onboarding
