# PDF Form Filler - Project Overview

## What This Does

Automatically fills PDF forms (like your Belmar Form) with provider data from Google Sheets. Built specifically for Fountain's provider onboarding workflow.

## Why a Website vs Chrome Extension?

**Website wins for PDF forms because:**
- PDF form filling requires server-side processing (pdf-lib library)
- Chrome extensions can't reliably manipulate PDF form fields
- Cleaner workflow: upload → select → download
- Easier Google Sheets authentication
- Better for team collaboration (deploy once, everyone uses)

## System Architecture

```
┌─────────────────┐
│  Google Sheet   │  ← Your provider data
│  (Data Source)  │
└────────┬────────┘
         │
         │ API Call
         ▼
┌─────────────────────────────────────┐
│      Next.js Web Application        │
│  ┌─────────────────────────────┐   │
│  │  Frontend (React/TypeScript)│   │
│  │  • Upload PDF               │   │
│  │  • Select person            │   │
│  │  • Map fields               │   │
│  │  • Download filled PDF      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Backend API Routes         │   │
│  │  • /api/extract-fields      │   │
│  │  • /api/fill-pdf            │   │
│  │  • /api/sheets              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         │ PDF Processing (pdf-lib)
         ▼
┌─────────────────┐
│  Filled PDF     │  ← Download to user
│  Ready to use   │
└─────────────────┘
```

## Tech Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| Framework | Next.js 14 | Best React framework, great API routes |
| Language | TypeScript | Type safety, fewer bugs |
| Styling | Tailwind CSS | Fast, Fountain pink/blue branding |
| PDF Processing | pdf-lib | Industry standard, works server-side |
| Data Source | Google Sheets API | Easy to update, no database needed |
| Deployment | Vercel | One-click deploy, perfect for Next.js |

## Key Features

✅ **Automatic Field Detection** - Scans PDF and finds all fillable fields  
✅ **Visual Field Mapping** - Drag-and-drop style interface to match Sheet columns to PDF fields  
✅ **Checkbox Exclusion** - As requested, only fills text fields  
✅ **Instant Download** - Filled PDF ready immediately  
✅ **Reusable Templates** - Upload PDF once, use many times  
✅ **Team Friendly** - Deploy once, whole team can use  

## User Workflow

1. **One-Time Setup**
   - Set up Google Service Account (5 minutes)
   - Share Google Sheet with service account
   - Deploy to Vercel

2. **Daily Use**
   - Upload PDF template (or select saved one)
   - Choose provider from dropdown
   - Click "Fill PDF"
   - Download completed form

3. **Time Saved**
   - Manual form filling: ~10 minutes per form
   - With this tool: ~30 seconds per form
   - **Savings: 95% reduction in time** ⚡

## File Structure

```
pdf-form-filler/
├── app/
│   ├── api/
│   │   ├── extract-fields/route.ts  # Extracts fields from PDF
│   │   ├── fill-pdf/route.ts        # Fills PDF with data
│   │   └── sheets/route.ts          # Fetches Google Sheets data
│   ├── globals.css                  # Tailwind styles
│   ├── layout.tsx                   # App wrapper
│   └── page.tsx                     # Main UI (upload, map, fill)
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── QUICKSTART.md                    # 5-minute setup guide
├── GOOGLE_SHEET_TEMPLATE.md         # Sheet structure guide
├── README.md                        # Full documentation
└── package.json                     # Dependencies
```

## Security & Privacy

- ✅ Service account has read-only access to sheets
- ✅ No data stored on server (processed in memory)
- ✅ PDFs never saved (direct download to user)
- ✅ Environment variables keep credentials secure
- ✅ Can deploy behind auth if needed (Vercel password protection)

## Customization Options

Easy to modify:
- **Branding**: Update colors in `app/page.tsx` (currently pink/blue Fountain colors)
- **Field Mapping**: Add auto-mapping logic if field names match column names
- **Bulk Processing**: Add ability to fill multiple PDFs at once
- **Templates**: Save field mappings for different PDF types
- **Checkboxes**: Can enable checkbox filling if needed (commented out code ready)

## Next Steps After Setup

1. **Test with Sample Data**: Use 1-2 providers to verify field mapping
2. **Create Field Mapping Templates**: Save mappings for commonly used forms
3. **Deploy to Vercel**: Make it available to the whole team
4. **Document Field Mappings**: Create a guide showing which Sheet columns map to which PDF fields
5. **Add More Forms**: Upload additional PDF templates as needed

## Future Enhancements

Could add:
- Bulk fill (process 10+ providers at once)
- PDF template library (save commonly used forms)
- Direct upload to Google Drive
- Email filled PDFs automatically
- Signature field support
- Multi-page PDF support
- Form validation before filling

## Cost

**Free tier covers most usage:**
- Next.js/Vercel: Free for small teams
- Google Sheets API: Free up to 100 requests/100 seconds
- No database costs (using Google Sheets)

**Estimated monthly cost: $0** for typical Fountain usage

---

## Questions?

1. **Can I fill checkboxes?** - Currently skipped, but easy to enable if needed
2. **How many providers can I process?** - Unlimited (limited only by Google Sheets API quota)
3. **Can I use multiple PDF templates?** - Yes! Upload different templates for different forms
4. **What if my Sheet changes?** - No problem, it fetches fresh data each time
5. **Can I save field mappings?** - Not yet, but easy to add (localStorage or database)

---

Built for Fountain Provider Onboarding 🚀
