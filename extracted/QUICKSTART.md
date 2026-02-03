# Quick Start Guide - PDF Form Filler

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (2 minutes)
```bash
cd pdf-form-filler
npm install
```

### Step 2: Set Up Google Sheets Access (2 minutes)

1. Go to: https://console.cloud.google.com/
2. Create new project → Enable "Google Sheets API"
3. Create Service Account → Download JSON key
4. Copy `.env.example` to `.env.local`
5. Fill in email and private key from JSON:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 3: Share Your Sheet
1. Open your Google Sheet with provider data
2. Click "Share"
3. Paste the service account email (from step 2)
4. Give "Viewer" access

### Step 4: Run the App (1 minute)
```bash
npm run dev
```

Open http://localhost:3000

### Step 5: Use It!
1. Upload your PDF (Belmar Form)
2. Enter your Google Sheet ID
3. Click "Fetch People Data"
4. Map fields
5. Select a person
6. Click "Fill PDF Form"
7. Download! ✅

---

## Common Sheet ID Location

Your Google Sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
```

Copy everything between `/d/` and `/edit`

---

## Troubleshooting

**Can't fetch data?**
- Did you share the sheet with the service account email?
- Is the Sheet ID correct?
- Check your .env.local file

**PDF won't fill?**
- Make sure fields are mapped correctly
- Check that the column names match your sheet

---

## Next Steps

- Deploy to Vercel for team access
- Create multiple PDF templates
- Add more providers to your sheet

Need help? Check the full README.md
