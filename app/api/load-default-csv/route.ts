import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Try to read the standard format CSV first (preferred)
    let csvPath = join(process.cwd(), 'providers-standard-format.csv');
    let fileName = 'providers-standard-format.csv';
    let fileContent: string;
    
    try {
      fileContent = readFileSync(csvPath, 'utf-8');
    } catch (error) {
      // If standard format doesn't exist, try the provider compliance dashboard
      csvPath = join(process.cwd(), 'Provider _ Compliance Dashboard - Provider Info (3).csv');
      fileName = 'Provider _ Compliance Dashboard - Provider Info (3).csv';
      try {
        fileContent = readFileSync(csvPath, 'utf-8');
      } catch (altError) {
        return NextResponse.json(
          { error: 'Default CSV file not found' },
          { status: 404 }
        );
      }
    }

    // Parse CSV
    const rows = parseCSV(fileContent);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ people: [] });
    }

    // First row is headers
    const headers = rows[0].map(h => String(h).trim()).filter(h => h);
    
    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'No headers found in spreadsheet' },
        { status: 400 }
      );
    }

    // Convert rows to objects
    const people = rows.slice(1)
      .filter(row => row.some(cell => cell && String(cell).trim()))
      .map(row => {
        const person: Record<string, string> = {};
        headers.forEach((header, index) => {
          person[header] = row[index] ? String(row[index]).trim() : '';
        });
        return person;
      });

    return NextResponse.json({ 
      people,
      fileName,
      fileContent: Buffer.from(fileContent).toString('base64')
    });
  } catch (error) {
    console.error('Error loading default CSV:', error);
    return NextResponse.json(
      { error: 'Failed to load default CSV' },
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

