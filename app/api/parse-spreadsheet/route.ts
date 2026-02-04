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

    // Check if this is a transposed format (providers as columns, attributes as rows)
    const isTransposed = detectTransposedFormat(rows);
    
    let people: Record<string, string>[];
    
    if (isTransposed) {
      // Convert transposed format to standard format
      people = convertTransposedToStandard(rows);
    } else {
      // Standard format: first row is headers, subsequent rows are providers
      const headers = rows[0].map(h => String(h).trim()).filter(h => h);
      
      if (headers.length === 0) {
        return NextResponse.json(
          { error: 'No headers found in spreadsheet. Please ensure the first row contains column names.' },
          { status: 400 }
        );
      }

      // Convert rows to objects
      people = rows.slice(1)
        .filter(row => row.some(cell => cell && String(cell).trim())) // Filter out completely empty rows
        .map(row => {
          const person: Record<string, string> = {};
          headers.forEach((header, index) => {
            person[header] = row[index] ? String(row[index]).trim() : '';
          });
          return person;
        });
    }

    // Filter out termed providers
    const activePeople = people.filter(person => {
      const nameColumn = person.Name || person.name || person['Provider Name'] || person['Full Name'] || '';
      const nameValue = String(nameColumn).toLowerCase();
      return !nameValue.includes('termed');
    });

    return NextResponse.json({ people: activePeople });
  } catch (error) {
    console.error('Error parsing spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to parse spreadsheet file' },
      { status: 500 }
    );
  }
}

// Detect if CSV is in transposed format (providers as columns, attributes as rows)
function detectTransposedFormat(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  
  const firstRow = rows[0];
  const secondRow = rows[1];
  
  // Check if first column is "Column 1" or similar, and second row has an attribute name
  const firstCol = firstRow[0]?.toLowerCase().trim() || '';
  const secondRowFirstCol = secondRow[0]?.toLowerCase().trim() || '';
  
  // Transposed format indicators:
  // 1. First column is "Column 1" or empty
  // 2. Second row's first column looks like an attribute name (not a provider name)
  // 3. First row has many columns (provider names)
  const looksLikeTransposed = (
    (firstCol === 'column 1' || firstCol === '' || firstCol === 'name') &&
    secondRowFirstCol.length > 0 &&
    firstRow.length > 3 // Multiple provider columns
  );
  
  return looksLikeTransposed;
}

// Convert transposed format to standard format
function convertTransposedToStandard(rows: string[][]): Record<string, string>[] {
  // First row contains provider names (skip "Column 1" if it exists)
  const firstRow = rows[0];
  const providerNames = firstRow.slice(1); // Skip first column
  
  // Find the attribute rows (rows that have a label in first column, skip first row)
  const attributeRows = rows.slice(1).filter(row => row[0] && row[0].trim());
  
  // Build standard format: one object per provider
  const people: Record<string, string>[] = [];
  
  for (let providerIndex = 0; providerIndex < providerNames.length; providerIndex++) {
    const providerName = providerNames[providerIndex]?.trim() || '';
    if (!providerName || providerName.toLowerCase().includes('termed')) continue;
    
    const person: Record<string, string> = {
      Name: providerName, // Set Name as first field
    };
    
    // Get values for this provider from each attribute row
    for (const attrRow of attributeRows) {
      const attributeName = attrRow[0]?.trim() || '';
      if (!attributeName) continue;
      
      const value = attrRow[providerIndex + 1] || ''; // +1 because first column is attribute name
      person[attributeName] = String(value).trim();
    }
    
    people.push(person);
  }
  
  return people;
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

