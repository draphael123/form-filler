import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Sheet ID is required' },
        { status: 400 }
      );
    }

    // Set up Google Sheets API authentication
    // You'll need to set up a service account and add credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all data from the first sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:Z', // Adjust range as needed
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ people: [] });
    }

    // First row is headers
    const headers = rows[0];
    
    // Convert rows to objects
    const people = rows.slice(1).map(row => {
      const person: Record<string, string> = {};
      headers.forEach((header, index) => {
        person[header] = row[index] || '';
      });
      return person;
    });

    return NextResponse.json({ people });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Sheets data. Make sure the sheet is shared with the service account.' },
      { status: 500 }
    );
  }
}
