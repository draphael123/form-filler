import { NextRequest, NextResponse } from 'next/server';
// xlsx uses namespace export, not default export
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let rows: string[][] = [];

    // Determine file type and parse accordingly
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      // Parse CSV file
      const text = buffer.toString('utf-8');
      rows = parseCSV(text);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
      rows = data;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)' },
        { status: 400 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ people: [] });
    }

    // First row is headers
    const headers = rows[0].map(h => String(h).trim()).filter(h => h);
    
    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'No headers found in spreadsheet. Please ensure the first row contains column names.' },
        { status: 400 }
      );
    }

    // Convert rows to objects
    const people = rows.slice(1)
      .filter(row => row.some(cell => cell && String(cell).trim())) // Filter out completely empty rows
      .map(row => {
        const person: Record<string, string> = {};
        headers.forEach((header, index) => {
          person[header] = row[index] ? String(row[index]).trim() : '';
        });
        return person;
      });

    return NextResponse.json({ people });
  } catch (error) {
    console.error('Error parsing spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to parse spreadsheet file' },
      { status: 500 }
    );
  }
}

// Simple CSV parser (handles basic CSV format)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

