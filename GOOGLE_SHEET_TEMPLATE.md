# Google Sheet Template for Provider Onboarding

## Recommended Column Structure

Here's a suggested structure for your Google Sheet to store provider information. You can customize this based on your specific PDF form fields.

### Example Columns:

1. **Provider_Name** - Full name of the provider
2. **First_Name** - First name
3. **Last_Name** - Last name  
4. **Middle_Initial** - Middle initial or name
5. **Email** - Email address
6. **Phone** - Phone number
7. **Address_Line_1** - Street address
8. **Address_Line_2** - Apt/Suite number (optional)
9. **City** - City
10. **State** - State (2-letter code)
11. **ZIP** - ZIP code
12. **License_Number** - Medical license number
13. **License_State** - State where licensed
14. **NPI** - National Provider Identifier
15. **DEA** - DEA number (if applicable)
16. **Specialty** - Medical specialty
17. **Date_of_Birth** - DOB (format: MM/DD/YYYY)
18. **SSN_Last_Four** - Last 4 digits of SSN
19. **Practice_Name** - Name of practice
20. **Tax_ID** - Tax ID or EIN

## Sample Data Row

| Provider_Name | First_Name | Last_Name | Email | Phone | Address_Line_1 | City | State | ZIP |
|--------------|------------|-----------|-------|-------|----------------|------|-------|-----|
| Dr. Jane Smith | Jane | Smith | jane.smith@example.com | 555-0123 | 123 Main Street | Denver | CO | 80202 |

## Tips for Setup

1. **Use Clear Column Names**: Make column headers descriptive so they're easy to match to PDF fields
2. **Consistent Formatting**: Keep data formatting consistent (e.g., all phone numbers in same format)
3. **Required Fields First**: Put most commonly used fields in the first columns
4. **Leave Empty Cells Blank**: Don't use "N/A" or dashes - just leave empty
5. **One Provider Per Row**: Each row should represent one provider

## For Belmar Form Specifically

If you're using the Belmar Form (MD).pdf, you'll want columns that match common medical licensing fields:

- Provider identification (name, DOB, contact info)
- Licensing information (license number, state, expiration)
- Credentials (NPI, DEA, specialty)
- Practice information (address, tax ID)
- Insurance/authorization details

## Sheet Sharing Reminder

Don't forget to:
1. Share your Google Sheet with your service account email
2. Give it at least "Viewer" permissions
3. Keep the sheet ID handy (from the URL)

---

Once your sheet is set up, you can fetch the data in the app and map columns to your PDF form fields!
