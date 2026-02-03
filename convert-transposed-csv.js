/**
 * Convert transposed CSV to standard format
 * Transposed format: Providers as columns, attributes as rows
 * Standard format: Providers as rows, attributes as columns
 */

const fs = require('fs');
const path = require('path');

// Get input file from command line or use default
const inputFile = process.argv[2] || path.join(__dirname, '../Downloads/Provider _ Compliance Dashboard - Provider Info (1).csv');
const outputFile = process.argv[3] || path.join(__dirname, 'providers-standard-format.csv');

console.log('Converting transposed CSV to standard format...');
console.log('Input:', inputFile);
console.log('Output:', outputFile);

try {
  // Read the CSV file
  const content = fs.readFileSync(inputFile, 'utf-8');
  
  // Parse CSV properly handling multi-line quoted fields
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (but skip if we're in quotes - it's part of the field)
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell)) { // Only add non-empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // Add last field/row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell)) {
      rows.push(currentRow);
    }
  }
  
  // Transpose: Convert from [attributes x providers] to [providers x attributes]
  if (rows.length === 0) {
    console.error('Error: File is empty');
    process.exit(1);
  }
  
  // First row contains provider names (skip "Column 1" if it exists)
  const providerNames = rows[0].slice(1); // Skip first column if it's "Column 1"
  
  // Find the attribute rows (rows that have a label in first column)
  const attributeRows = rows.slice(1).filter(row => row[0] && row[0].trim());
  
  // Build the standard format
  const standardRows = [];
  
  // Header row: attribute names
  const headers = ['Name', ...attributeRows.map(row => row[0].trim())];
  standardRows.push(headers);
  
  // Data rows: one per provider
  for (let providerIndex = 0; providerIndex < providerNames.length; providerIndex++) {
    const providerName = providerNames[providerIndex]?.trim() || `Provider ${providerIndex + 1}`;
    if (!providerName || providerName === 'TERM>') continue; // Skip empty or term markers
    
    const providerRow = [providerName];
    
    // Get values for this provider from each attribute row
    for (const attrRow of attributeRows) {
      const value = attrRow[providerIndex + 1] || ''; // +1 because first column is attribute name
      providerRow.push(value.trim());
    }
    
    standardRows.push(providerRow);
  }
  
  // Write to CSV
  const output = standardRows.map(row => 
    row.map(cell => {
      // Escape cells with commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
  
  fs.writeFileSync(outputFile, output, 'utf-8');
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`   Found ${standardRows.length - 1} providers`);
  console.log(`   With ${headers.length - 1} attributes each`);
  console.log(`\n   Output saved to: ${outputFile}`);
  console.log(`\n   You can now use this file in the PDF Form Filler app!`);
  
} catch (error) {
  console.error('Error converting file:', error.message);
  process.exit(1);
}

