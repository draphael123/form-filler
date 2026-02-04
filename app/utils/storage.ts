// LocalStorage utilities for saving templates, mappings, and history

export interface SavedMapping {
  pdfFileName: string;
  pdfFields: string[];
  mappings: Record<string, string>;
  createdAt: string;
  lastUsed: string;
}

export interface FilledFormHistory {
  id: string;
  providerName: string;
  pdfFileName: string;
  filledAt: string;
  mappings: Record<string, string>;
}

export interface Person {
  [key: string]: string;
}

const STORAGE_KEYS = {
  MAPPINGS: 'pdf_filler_mappings',
  HISTORY: 'pdf_filler_history',
  SETTINGS: 'pdf_filler_settings',
  DEFAULT_CSV: 'pdf_filler_default_csv',
};

// Save mapping template
export function saveMappingTemplate(
  pdfFileName: string,
  pdfFields: string[],
  mappings: Record<string, string>
): void {
  try {
    const existing = getSavedMappings();
    const template: SavedMapping = {
      pdfFileName,
      pdfFields,
      mappings,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    // Update or add template
    const index = existing.findIndex(t => t.pdfFileName === pdfFileName);
    if (index >= 0) {
      existing[index] = { ...existing[index], mappings, lastUsed: template.lastUsed };
    } else {
      existing.push(template);
    }

    localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving mapping template:', error);
  }
}

// Get saved mappings
export function getSavedMappings(): SavedMapping[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading saved mappings:', error);
    return [];
  }
}

// Get mapping for specific PDF
export function getMappingForPDF(pdfFileName: string): Record<string, string> | null {
  const templates = getSavedMappings();
  const template = templates.find(t => t.pdfFileName === pdfFileName);
  return template ? template.mappings : null;
}

// Save to history
export function saveToHistory(
  providerName: string,
  pdfFileName: string,
  mappings: Record<string, string>
): void {
  try {
    const history = getHistory();
    const entry: FilledFormHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      providerName,
      pdfFileName,
      filledAt: new Date().toISOString(),
      mappings,
    };

    history.unshift(entry);
    // Keep only last 100 entries
    const limited = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

// Get history
export function getHistory(): FilledFormHistory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

// Clear history
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// Export mappings as JSON
export function exportMappings(pdfFileName: string): string | null {
  const template = getSavedMappings().find(t => t.pdfFileName === pdfFileName);
  return template ? JSON.stringify(template, null, 2) : null;
}

// Import mappings from JSON
export function importMappings(json: string): boolean {
  try {
    const template: SavedMapping = JSON.parse(json);
    const existing = getSavedMappings();
    const index = existing.findIndex(t => t.pdfFileName === template.pdfFileName);
    
    if (index >= 0) {
      existing[index] = template;
    } else {
      existing.push(template);
    }
    
    localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Error importing mappings:', error);
    return false;
  }
}

// Default CSV/Spreadsheet storage
export interface DefaultCSV {
  fileName: string;
  fileData: string; // base64 encoded
  people: Person[]; // Store parsed data
  setAt: string;
}

// Save default CSV
export async function saveDefaultCSV(file: File, people: Person[]): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const defaultCSV: DefaultCSV = {
          fileName: file.name,
          fileData: base64,
          people: people,
          setAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.DEFAULT_CSV, JSON.stringify(defaultCSV));
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error saving default CSV:', error);
    return false;
  }
}

// Get default CSV
export function getDefaultCSV(): DefaultCSV | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEFAULT_CSV);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading default CSV:', error);
    return null;
  }
}

// Convert default CSV back to File object
export function defaultCSVToFile(defaultCSV: DefaultCSV): File | null {
  try {
    // Extract base64 data (remove data: prefix)
    const base64Data = defaultCSV.fileData.split(',')[1] || defaultCSV.fileData;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // Determine MIME type based on file extension
    const extension = defaultCSV.fileName.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'xlsx' || extension === 'xls' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';
    
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], defaultCSV.fileName, { type: mimeType });
  } catch (error) {
    console.error('Error converting default CSV to file:', error);
    return null;
  }
}

// Clear default CSV
export function clearDefaultCSV(): void {
  localStorage.removeItem(STORAGE_KEYS.DEFAULT_CSV);
}

