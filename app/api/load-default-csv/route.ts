import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Try to read the Provider Compliance Dashboard CSV first (transposed format)
    let csvPath = join(process.cwd(), 'Provider _ Compliance Dashboard - Provider Info (3).csv');
    let fileName = 'Provider _ Compliance Dashboard - Provider Info (3).csv';
    let fileContent: string;
    
    try {
      fileContent = readFileSync(csvPath, 'utf-8');
    } catch (error) {
      // If transposed format doesn't exist, try the standard format
      csvPath = join(process.cwd(), 'providers-standard-format.csv');
      fileName = 'providers-standard-format.csv';
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
          { error: 'No headers found in spreadsheet' },
          { status: 400 }
        );
      }

      // Convert rows to objects
      people = rows.slice(1)
        .filter(row => row.some(cell => cell && String(cell).trim()))
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

    return NextResponse.json({ 
      people: activePeople,
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

