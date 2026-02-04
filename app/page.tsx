'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveMappingTemplate, getMappingForPDF, saveToHistory, getHistory, exportMappings, importMappings, saveDefaultCSV, getDefaultCSV, defaultCSVToFile, clearDefaultCSV, Person } from './utils/storage';
import { autoFormat } from './utils/formatting';
import { validateField } from './utils/validation';

interface FormField {
  name: string;
  type: string;
  value?: string;
}


export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [dataSource, setDataSource] = useState<'google' | 'file'>('file');
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // New features state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showFieldPreview, setShowFieldPreview] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('{ProviderName}_{FormName}');
  const [isDefaultCSV, setIsDefaultCSV] = useState(false);

  // Extract fields from uploaded PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/extract-fields', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      // Filter out checkboxes as requested
      const textFields = data.fields.filter((f: FormField) => 
        f.type !== 'checkbox' && f.type !== 'radio'
      );
      setFormFields(textFields);
      
      // Try to load saved mapping for this PDF
      const savedMapping = getMappingForPDF(file.name);
      if (savedMapping) {
        setFieldMapping(savedMapping);
        setNotification({ type: 'success', message: 'Loaded saved field mappings for this PDF' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error extracting fields:', error);
      alert('Error extracting PDF fields');
    } finally {
      setLoading(false);
    }
  };

  // Fetch people from Google Sheets
  const handleFetchPeople = async () => {
    if (!sheetId) {
      alert('Please enter a Google Sheet ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/sheets?sheetId=${sheetId}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      // Additional safety filter for termed providers (in case any slip through)
      const activePeople = data.people.filter((person: Person) => {
        const name = getProviderName(person);
        return !name.toLowerCase().includes('termed');
      });
      setPeople(activePeople);
      
      if (activePeople.length < data.people.length) {
        const filteredCount = data.people.length - activePeople.length;
        setNotification({ type: 'info', message: `Loaded ${activePeople.length} providers (${filteredCount} termed providers excluded)` });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
      alert('Error fetching Google Sheets data');
    } finally {
      setLoading(false);
    }
  };

  // Parse uploaded spreadsheet file (CSV/Excel)
  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpreadsheetFile(file);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-spreadsheet', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      // Additional safety filter for termed providers (in case any slip through)
      const activePeople = data.people.filter((person: Person) => {
        const name = getProviderName(person);
        return !name.toLowerCase().includes('termed');
      });
      setPeople(activePeople);
      setIsDefaultCSV(false); // Reset flag when manually uploading
      
      if (activePeople.length < data.people.length) {
        const filteredCount = data.people.length - activePeople.length;
        setNotification({ type: 'info', message: `Loaded ${activePeople.length} providers (${filteredCount} termed providers excluded)` });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error('Error parsing spreadsheet:', error);
      alert('Error parsing spreadsheet file');
    } finally {
      setLoading(false);
    }
  };

  // Load default CSV on page load
  const loadDefaultCSV = async () => {
    const defaultCSV = getDefaultCSV();
    if (defaultCSV && defaultCSV.people && defaultCSV.people.length > 0) {
      // Additional safety filter for termed providers (in case any slip through)
      const activePeople = defaultCSV.people.filter((person: Person) => {
        const name = getProviderName(person);
        return !name.toLowerCase().includes('termed');
      });
      setPeople(activePeople);
      setIsDefaultCSV(true);
      
      // Also set the file reference if needed
      const file = defaultCSVToFile(defaultCSV);
      if (file) {
        setSpreadsheetFile(file);
      }
      
      const filteredCount = defaultCSV.people.length - activePeople.length;
      const message = filteredCount > 0
        ? `Loaded default data source: ${defaultCSV.fileName} (${activePeople.length} active providers, ${filteredCount} termed excluded)`
        : `Loaded default data source: ${defaultCSV.fileName} (${activePeople.length} providers)`;
      setNotification({ type: 'info', message });
      setTimeout(() => setNotification(null), 4000);
    } else {
      // If no default CSV is saved, try to load the provider compliance dashboard
      try {
        const response = await fetch('/api/load-default-csv');
        if (response.ok) {
          const data = await response.json();
          if (data.people && data.people.length > 0) {
            // Additional safety filter for termed providers (in case any slip through)
            const activePeople = data.people.filter((person: Person) => {
              const name = getProviderName(person);
              return !name.toLowerCase().includes('termed');
            });
            setPeople(activePeople);
            setIsDefaultCSV(true);
            
            // Create a file object from the base64 data
            const byteCharacters = atob(data.fileContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'text/csv' });
            const file = new File([blob], data.fileName, { type: 'text/csv' });
            setSpreadsheetFile(file);
            
            // Automatically save it as the default (save only active people)
            await saveDefaultCSV(file, activePeople);
            
            const filteredCount = data.people.length - activePeople.length;
            const message = filteredCount > 0 
              ? `Loaded Provider Compliance Dashboard: ${activePeople.length} active providers (${filteredCount} termed excluded)`
              : `Loaded Provider Compliance Dashboard: ${activePeople.length} providers`;
            setNotification({ type: 'info', message });
            setTimeout(() => setNotification(null), 4000);
          }
        }
      } catch (error) {
        console.error('Error loading default CSV:', error);
        // Silently fail - user can still upload manually
      }
    }
  };

  // Set current CSV as default
  const handleSetCSVAsDefault = async () => {
    if (!spreadsheetFile || people.length === 0) {
      setNotification({ type: 'error', message: 'Please upload a spreadsheet with data first' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const success = await saveDefaultCSV(spreadsheetFile, people);
    if (success) {
      setIsDefaultCSV(true);
      setNotification({ type: 'success', message: `"${spreadsheetFile.name}" set as default data source` });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'error', message: 'Failed to save default CSV' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Clear default CSV
  const handleClearDefaultCSV = () => {
    clearDefaultCSV();
    setIsDefaultCSV(false);
    setPeople([]);
    setSpreadsheetFile(null);
    setNotification({ type: 'success', message: 'Default data source cleared' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fill PDF with selected person's data
  const handleFillPdf = async () => {
    if (!pdfFile || !selectedPerson) {
      setNotification({ type: 'error', message: 'Please upload a PDF and select a provider' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('personData', JSON.stringify(selectedPerson));
      formData.append('fieldMapping', JSON.stringify(fieldMapping));

      const response = await fetch('/api/fill-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fill PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use custom filename pattern
      const providerName = getProviderName(selectedPerson);
      const filename = downloadFilename
        .replace('{ProviderName}', providerName.replace(/[^a-z0-9]/gi, '_'))
        .replace('{FormName}', pdfFile.name.replace('.pdf', ''));
      
      a.download = `${filename}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Save to history
      saveToHistory(providerName, pdfFile.name, fieldMapping);
      
      setNotification({ type: 'success', message: 'PDF filled and downloaded successfully' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error filling PDF:', error);
      setNotification({ type: 'error', message: 'Error filling PDF. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced auto-map function with comprehensive field matching
  const autoMapFields = () => {
    if (formFields.length === 0 || sheetColumns.length === 0) return;

    const mapping: Record<string, string> = {};
    
    // Comprehensive field patterns for Provider Compliance Dashboard
    const fieldPatterns: Record<string, string[]> = {
      // Name variations
      name: ['name', 'provider name', 'full name', 'provider_name', 'fullname', 'provider', 'column 1'],
      firstName: ['first name', 'firstname', 'first_name', 'fname', 'first'],
      lastName: ['last name', 'lastname', 'last_name', 'lname', 'surname', 'last'],
      
      // Contact information
      address: ['address', 'street address', 'street_address', 'addr', 'address line 1', 'address_line_1', 'street'],
      city: ['city'],
      state: ['state'],
      zip: ['zip', 'zip code', 'zipcode', 'zip_code', 'postal code', 'postal_code', 'postal'],
      phone: ['phone', 'phone number', 'phone_number', 'telephone', 'tel', 'mobile', 'cell'],
      email: ['email', 'e-mail', 'email address', 'email_address', 'fountain email', 'personal email'],
      
      // Professional identifiers
      npi: ['npi', 'npi #', 'npi_number', 'national provider identifier', 'npi#'],
      dea: ['dea', 'dea license', 'dea_license', 'dea number', 'dea_number', 'dea license number'],
      license: ['license', 'license number', 'license_number', 'lic', 'state license'],
      
      // Emergency contact
      emergencyContact: ['emergency contact', 'emergency_contact', 'emergency', 'emergency name', 'emergency contact name'],
      emergencyPhone: ['emergency phone', 'emergency_phone', 'emergency number', 'emergency contact number'],
      
      // Dates
      date: ['date', 'start date', 'contract start date', 'start_date', 'contract date'],
      
      // Additional fields
      notes: ['notes', 'note', 'comments', 'comment'],
    };

    // Also try direct column name matching (case-insensitive, partial match)
    formFields.forEach((pdfField) => {
      const pdfFieldLower = pdfField.name.toLowerCase().trim();
      let matched = false;
      
      // First, try pattern-based matching
      for (const [patternKey, patterns] of Object.entries(fieldPatterns)) {
        for (const pattern of patterns) {
          if (pdfFieldLower.includes(pattern) || pattern.includes(pdfFieldLower)) {
            // Find best matching column in spreadsheet
            const matchingColumn = sheetColumns.find(col => {
              const colLower = col.toLowerCase().trim();
              // Exact match
              if (colLower === pattern || colLower === patternKey) return true;
              // Contains pattern
              if (colLower.includes(pattern) || pattern.includes(colLower)) return true;
              // Contains pattern key
              if (colLower.includes(patternKey) || patternKey.includes(colLower)) return true;
              // Any pattern in the list matches
              return patterns.some(p => colLower.includes(p) || p.includes(colLower));
            });
            
            if (matchingColumn && !mapping[pdfField.name]) {
              mapping[pdfField.name] = matchingColumn;
              matched = true;
              break;
            }
          }
        }
        if (matched) break;
      }
      
      // If no pattern match, try direct column name matching
      if (!matched) {
        const directMatch = sheetColumns.find(col => {
          const colLower = col.toLowerCase().trim();
          const pdfLower = pdfFieldLower;
          // Remove common separators and compare
          const colNormalized = colLower.replace(/[_\s-]/g, '');
          const pdfNormalized = pdfLower.replace(/[_\s-]/g, '');
          
          // Check if they're similar (one contains the other)
          return colNormalized.includes(pdfNormalized) || 
                 pdfNormalized.includes(colNormalized) ||
                 colLower === pdfLower;
        });
        
        if (directMatch && !mapping[pdfField.name]) {
          mapping[pdfField.name] = directMatch;
        }
      }
    });

    setFieldMapping(prev => ({ ...prev, ...mapping }));
  };

  // Generate preview PDF
  const generatePreview = async () => {
    if (!pdfFile || !selectedPerson || Object.keys(fieldMapping).length === 0) {
      return;
    }

    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('personData', JSON.stringify(selectedPerson));
      formData.append('fieldMapping', JSON.stringify(fieldMapping));

      const response = await fetch('/api/preview-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Clean up old preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Update field mapping
  const updateMapping = (pdfField: string, sheetColumn: string) => {
    const newMapping = {
      ...fieldMapping,
      [pdfField]: sheetColumn,
    };
    setFieldMapping(newMapping);
    
    // Save mapping template
    if (pdfFile && formFields.length > 0) {
      saveMappingTemplate(
        pdfFile.name,
        formFields.map(f => f.name),
        newMapping
      );
    }
    
    // Auto-update preview if provider is selected
    if (selectedPerson) {
      setTimeout(() => generatePreview(), 500); // Debounce
    }
  };
  
  // Filter providers based on search
  const filteredPeople = people.filter((person, idx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const displayName = getProviderName(person);
    return displayName.toLowerCase().includes(query) ||
           Object.values(person).some(val => String(val).toLowerCase().includes(query));
  });
  
  // Bulk fill PDFs
  const handleBulkFill = async () => {
    if (selectedProviders.length === 0 || !pdfFile) {
      setNotification({ type: 'error', message: 'Please select at least one provider' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setBulkProcessing(true);
    setLoading(true);
    
    try {
      const filledPDFs: { name: string; blob: Blob }[] = [];
      
      for (const idx of selectedProviders) {
        const person = people[idx];
        const providerName = getProviderName(person) || `Provider ${idx + 1}`;
        
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('personData', JSON.stringify(person));
        formData.append('fieldMapping', JSON.stringify(fieldMapping));
        
        const response = await fetch('/api/fill-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const blob = await response.blob();
          filledPDFs.push({ name: providerName, blob });
          
          // Save to history
          saveToHistory(providerName, pdfFile.name, fieldMapping);
        }
      }
      
      // Download all as ZIP (or individual files)
      if (filledPDFs.length > 0) {
        // For now, download individually
        filledPDFs.forEach(({ name, blob }) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const filename = downloadFilename
            .replace('{ProviderName}', name.replace(/[^a-z0-9]/gi, '_'))
            .replace('{FormName}', pdfFile.name.replace('.pdf', ''));
          a.download = `${filename}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        });
        
        setNotification({ 
          type: 'success', 
          message: `Successfully filled ${filledPDFs.length} PDF${filledPDFs.length > 1 ? 's' : ''}` 
        });
        setTimeout(() => setNotification(null), 5000);
        setSelectedProviders([]);
      }
    } catch (error) {
      console.error('Error in bulk fill:', error);
      setNotification({ type: 'error', message: 'Error processing bulk fill' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setBulkProcessing(false);
      setLoading(false);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save mappings
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (pdfFile && formFields.length > 0) {
          saveMappingTemplate(pdfFile.name, formFields.map(f => f.name), fieldMapping);
          setNotification({ type: 'success', message: 'Mappings saved' });
          setTimeout(() => setNotification(null), 2000);
        }
      }
      
      // Ctrl/Cmd + D to download
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedPerson) {
        e.preventDefault();
        handleFillPdf();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowHowToUse(false);
        setShowHistory(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pdfFile, formFields, fieldMapping, selectedPerson]);
  
  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load default CSV on page load
  useEffect(() => {
    loadDefaultCSV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const sheetColumns = people.length > 0 ? Object.keys(people[0]) : [];

  // Helper function to get provider name (full name from Name column)
  const getProviderName = (person: Person): string => {
    // Prioritize "Name" column (full name)
    if (person.Name) return person.Name;
    if (person.name) return person.name;
    if (person['Provider Name']) return person['Provider Name'];
    if (person['Full Name']) return person['Full Name'];
    
    // Fallback to first column if Name column doesn't exist
    const firstColumnKey = Object.keys(person)[0];
    return person[firstColumnKey] || 'Provider';
  };

  // Auto-map when both PDF fields and spreadsheet columns are available
  useEffect(() => {
    if (formFields.length > 0 && sheetColumns.length > 0) {
      // Always try to auto-map, even if some mappings exist (to catch new fields)
      autoMapFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFields.length, sheetColumns.length]);

  // Generate preview when provider is selected and mapping exists
  useEffect(() => {
    if (selectedPerson && Object.keys(fieldMapping).length > 0 && pdfFile) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 500); // Debounce to allow mapping to settle
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson, fieldMapping]);

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex justify-between items-center">
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-4 text-white hover:text-gray-200">×</button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className={`mb-8 pb-6 border-b ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-3xl font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                Provider Compliance Dashboard
              </h1>
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>PDF form automation tool</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                }`}
                title="Toggle dark mode (Ctrl/Cmd + Shift + D)"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setShowHowToUse(!showHowToUse)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                {showHowToUse ? 'Hide Guide' : 'How to Use'}
              </button>
            </div>
          </div>
        </header>
        
        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>Fill History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {getHistory().length === 0 ? (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No history yet</p>
                ) : (
                  getHistory().map((entry) => (
                    <div key={entry.id} className={`p-3 rounded-md border ${darkMode ? 'border-slate-700 bg-slate-700' : 'border-blue-200 bg-blue-50'}`}>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{entry.providerName}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>{entry.pdfFileName}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {new Date(entry.filledAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* How to Use Section */}
        {showHowToUse && (
          <div className={`mb-8 rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-blue-900'}`}>How to Use</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Step 1: Upload PDF Form</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Select your PDF form. The application will automatically detect all fillable fields.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Step 2: Upload Provider Data</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Upload your Provider Compliance Dashboard file (CSV or Excel). Column 1 will be used as the provider identifier. Alternatively, connect to Google Sheets.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Step 3: Map Fields</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Fields are automatically mapped when possible. Review and adjust mappings as needed. This only needs to be done once per PDF template. Mappings are saved automatically.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Step 4: Select Provider</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Choose a provider from the dropdown or select multiple for bulk processing. Use the search box to filter providers. The form preview will update automatically with their information.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Step 5: Download</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Review the preview, customize the filename pattern if needed, then download the filled PDF form. Use Ctrl/Cmd + D for quick download.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Keyboard Shortcuts</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  <strong>Ctrl/Cmd + S:</strong> Save mappings | <strong>Ctrl/Cmd + D:</strong> Download PDF | <strong>Esc:</strong> Close modals
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left Column - PDF Upload */}
          <div className={`rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-blue-900'}`}>1. Upload PDF Form</h2>
            
            <label className="block">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="block w-full text-sm text-blue-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </label>

            {pdfFile && (
              <div className={`mt-4 p-3 rounded-md border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{pdfFile.name}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  {formFields.length} fillable fields detected
                </p>
              </div>
            )}

            {formFields.length > 0 && (
              <div className="mt-6">
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Form Fields</h3>
                <div className={`max-h-64 overflow-y-auto rounded-md border p-3 ${
                  darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="space-y-1">
                    {formFields.map((field, idx) => (
                      <div key={idx} className={`text-sm py-1 ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                        {field.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Data Source */}
          <div className={`rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-blue-900'}`}>2. Connect Data Source</h2>
            
            {/* Data Source Toggle */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => {
                  setDataSource('file');
                  // Reload default CSV if switching back to file source
                  if (isDefaultCSV) {
                    loadDefaultCSV();
                  }
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  dataSource === 'file'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => {
                  setDataSource('google');
                  setIsDefaultCSV(false); // Clear default flag when switching to Google Sheets
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  dataSource === 'google'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Google Sheets
              </button>
            </div>

            {/* File Upload Option */}
            {dataSource === 'file' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    Upload Provider Compliance Dashboard
                  </label>
                  {isDefaultCSV && (
                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                      ✓ Default
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSpreadsheetUpload}
                  className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium cursor-pointer ${
                    darkMode
                      ? 'text-blue-300 file:bg-slate-700 file:text-white hover:file:bg-slate-600'
                      : 'text-blue-700 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  }`}
                />
                <p className={`text-xs mt-2 mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Column 1 will be used as the provider identifier
                </p>
                {(spreadsheetFile || isDefaultCSV) && (
                  <div className={`p-3 rounded-md border mb-4 ${
                    darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                          {spreadsheetFile?.name || getDefaultCSV()?.fileName || 'Default data source'}
                        </p>
                        {people.length > 0 && (
                          <p className={`text-xs mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            {people.length} {people.length === 1 ? 'provider' : 'providers'} loaded
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isDefaultCSV && spreadsheetFile && people.length > 0 && (
                          <button
                            onClick={handleSetCSVAsDefault}
                            className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            title="Set as default data source"
                          >
                            Set as Default
                          </button>
                        )}
                        {isDefaultCSV && (
                          <button
                            onClick={handleClearDefaultCSV}
                            className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            title="Clear default data source"
                          >
                            Clear Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Google Sheets Option */}
            {dataSource === 'google' && (
              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    Google Sheet ID
                  </label>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="Enter Google Sheet ID"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                        : 'border-blue-300'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Found in Sheet URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit
                  </p>
                </div>

                <button
                  onClick={handleFetchPeople}
                  disabled={loading || !sheetId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? 'Loading...' : 'Fetch Data'}
                </button>
              </div>
            )}

            {people.length > 0 && (
              <div className={`mt-6 p-4 rounded-md border ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    {people.length} {people.length === 1 ? 'Provider' : 'Providers'} Loaded
                    {searchQuery && ` (${filteredPeople.length} filtered)`}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (selectedProviders.length === filteredPeople.length) {
                          setSelectedProviders([]);
                        } else {
                          setSelectedProviders(filteredPeople.map((_, idx) => people.indexOf(filteredPeople[idx])));
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'}`}
                    >
                      {selectedProviders.length === filteredPeople.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedProviders.length > 0 && (
                      <button
                        onClick={handleBulkFill}
                        disabled={bulkProcessing}
                        className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Bulk Fill ({selectedProviders.length})
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' 
                      : 'bg-white border-blue-300'
                  }`}
                />
                
                {/* Provider Selection - Single or Bulk */}
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    Select Provider
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (idx >= 0) {
                        setSelectedPerson(people[idx]);
                        setSelectedProviders([]); // Clear bulk selection
                      } else {
                        setSelectedPerson(null);
                      }
                    }}
                    value={selectedPerson ? people.indexOf(selectedPerson).toString() : ''}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-blue-300'
                    }`}
                  >
                    <option value="">Select a provider</option>
                    {filteredPeople.map((person, filteredIdx) => {
                      const originalIdx = people.indexOf(person);
                      const displayName = getProviderName(person) || person['Fountain Email Address']?.split('@')[0] || `Provider ${originalIdx + 1}`;
                      return (
                        <option key={originalIdx} value={originalIdx}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {/* Bulk Selection Checkboxes */}
                {filteredPeople.length > 0 && (
                  <div className="mb-3 max-h-48 overflow-y-auto border rounded-md p-2">
                    <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                      Or select multiple for bulk processing:
                    </p>
                    <div className="space-y-1">
                      {filteredPeople.map((person, filteredIdx) => {
                        const originalIdx = people.indexOf(person);
                        const displayName = getProviderName(person) || person['Fountain Email Address']?.split('@')[0] || `Provider ${originalIdx + 1}`;
                        const isSelected = selectedProviders.includes(originalIdx);
                        
                        return (
                          <label key={originalIdx} className={`flex items-center p-2 rounded cursor-pointer hover:bg-opacity-50 ${
                            isSelected 
                              ? darkMode ? 'bg-blue-700' : 'bg-blue-200' 
                              : darkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProviders([...selectedProviders, originalIdx]);
                                  setSelectedPerson(null); // Clear single selection
                                } else {
                                  setSelectedProviders(selectedProviders.filter(i => i !== originalIdx));
                                }
                              }}
                              className="mr-2"
                            />
                            <span className={`text-xs ${darkMode ? 'text-white' : 'text-blue-900'}`}>{displayName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPerson && (
                  <div className={`mt-4 p-3 rounded-md border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-blue-200'}`}>
                    <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Provider Information</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Object.entries(selectedPerson)
                        .filter(([key, value]) => value && String(value).trim())
                        .slice(0, 8)
                        .map(([key, value]) => {
                          const formattedValue = showFieldPreview ? autoFormat(key, String(value)) : value;
                          return (
                            <p key={key} className={`text-xs ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{key}:</span> {String(formattedValue).substring(0, 50)}{String(formattedValue).length > 50 ? '...' : ''}
                            </p>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Field Mapping Section */}
        {formFields.length > 0 && sheetColumns.length > 0 && (
          <div className={`mb-6 rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>3. Field Mapping</h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  {Object.keys(fieldMapping).filter(k => fieldMapping[k]).length} of {formFields.length} fields automatically mapped. Review and adjust as needed.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (pdfFile) {
                      const exported = exportMappings(pdfFile.name);
                      if (exported) {
                        const blob = new Blob([exported], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mappings-${pdfFile.name.replace('.pdf', '')}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setNotification({ type: 'success', message: 'Mappings exported' });
                        setTimeout(() => setNotification(null), 2000);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-slate-700 text-white hover:bg-slate-600' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title="Export mappings"
                >
                  Export
                </button>
                <button
                  onClick={autoMapFields}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-slate-700 text-white hover:bg-slate-600' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Re-map All Fields
                </button>
              </div>
            </div>
            
            {/* Field Value Preview Toggle */}
            {selectedPerson && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPreview"
                  checked={showFieldPreview}
                  onChange={(e) => setShowFieldPreview(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showPreview" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  Show field value preview
                </label>
              </div>
            )}
            
            {/* Field Value Preview Table */}
            {selectedPerson && showFieldPreview && Object.keys(fieldMapping).filter(k => fieldMapping[k]).length > 0 && (
              <div className={`mb-4 p-4 rounded-md border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Field Value Preview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-600' : 'border-blue-300'}`}>
                        <th className={`text-left py-2 px-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>PDF Field</th>
                        <th className={`text-left py-2 px-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>Spreadsheet Column</th>
                        <th className={`text-left py-2 px-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fieldMapping)
                        .filter(([_, col]) => col && col.trim())
                        .map(([pdfField, sheetColumn]) => {
                          const rawValue = selectedPerson[sheetColumn] || '';
                          const formattedValue = autoFormat(pdfField, String(rawValue));
                          const validation = validateField(pdfField, String(rawValue));
                          
                          return (
                            <tr key={pdfField} className={`border-b ${darkMode ? 'border-slate-600' : 'border-blue-200'}`}>
                              <td className={`py-2 px-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>{pdfField}</td>
                              <td className={`py-2 px-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>{sheetColumn}</td>
                              <td className={`py-2 px-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                                <span className={!validation.isValid ? 'text-red-500' : ''}>
                                  {formattedValue || <span className="italic text-gray-500">(empty)</span>}
                                </span>
                                {!validation.isValid && (
                                  <span className="ml-2 text-red-500 text-xs">⚠ {validation.error}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formFields.map((field) => {
                const isMapped = fieldMapping[field.name] && fieldMapping[field.name].trim() !== '';
                return (
                  <div key={field.name} className={`border rounded-md p-3 ${
                    isMapped 
                      ? darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50' 
                      : darkMode ? 'border-slate-600' : 'border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`block text-xs font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                        {field.name}
                      </label>
                      {isMapped && (
                        <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Mapped</span>
                      )}
                    </div>
                    <select
                      value={fieldMapping[field.name] || ''}
                      onChange={(e) => updateMapping(field.name, e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-blue-300'
                      }`}
                    >
                      <option value="">Skip field</option>
                      {sheetColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Preview Section */}
        {previewUrl && selectedPerson && (
          <div className={`mb-6 rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>Form Preview</h2>
              {previewLoading && (
                <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Updating...</span>
              )}
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Preview for <span className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{getProviderName(selectedPerson)}</span>
            </p>
            <div className={`border rounded-md overflow-hidden ${darkMode ? 'border-slate-600 bg-slate-900' : 'border-blue-300 bg-blue-50'}`} style={{ height: '600px' }}>
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </div>
        )}

        {/* Download Section */}
        {selectedPerson && formFields.length > 0 && (
          <div className={`mb-6 rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'}`}>
            <div className="mb-4">
              <h2 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>Download Filled Form</h2>
              <p className={`text-sm mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Ready to generate <span className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{pdfFile?.name}</span> with data from <span className={`font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>{getProviderName(selectedPerson)}</span>
              </p>
              <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {Object.keys(fieldMapping).filter(k => fieldMapping[k]).length} of {formFields.length} fields will be automatically filled from the spreadsheet
              </p>
              
              {/* Download Filename Pattern */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                  Filename Pattern
                </label>
                <input
                  type="text"
                  value={downloadFilename}
                  onChange={(e) => setDownloadFilename(e.target.value)}
                  placeholder="{ProviderName}_{FormName}"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-blue-300'
                  }`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Use {'{ProviderName}'} and {'{FormName}'} as placeholders
                </p>
              </div>
            </div>
            <button
              onClick={handleFillPdf}
              disabled={loading || Object.keys(fieldMapping).filter(k => fieldMapping[k]).length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
              title="Download (Ctrl/Cmd + D)"
            >
              {loading ? 'Generating PDF...' : 'Download Filled PDF'}
            </button>
            {loading && (
              <p className={`text-center text-xs mt-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Processing form data...</p>
            )}
            {Object.keys(fieldMapping).filter(k => fieldMapping[k]).length === 0 && !loading && (
              <p className={`text-center text-xs mt-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Please map at least one field to download</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
