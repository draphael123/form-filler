'use client';

import { useState, useEffect } from 'react';

interface FormField {
  name: string;
  type: string;
  value?: string;
}

interface Person {
  [key: string]: string;
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
      setPeople(data.people);
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
      setPeople(data.people);
    } catch (error) {
      console.error('Error parsing spreadsheet:', error);
      alert('Error parsing spreadsheet file');
    } finally {
      setLoading(false);
    }
  };

  // Fill PDF with selected person's data
  const handleFillPdf = async () => {
    if (!pdfFile || !selectedPerson) {
      alert('Please upload a PDF and select a person');
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled-${pdfFile.name}`;
      a.click();
    } catch (error) {
      console.error('Error filling PDF:', error);
      alert('Error filling PDF');
    } finally {
      setLoading(false);
    }
  };

  // Auto-map common fields
  const autoMapFields = () => {
    if (formFields.length === 0 || sheetColumns.length === 0) return;

    const mapping: Record<string, string> = {};
    
    // Common field patterns
    const fieldPatterns = {
      name: ['name', 'provider name', 'full name', 'provider_name', 'fullname', 'provider'],
      firstName: ['first name', 'firstname', 'first_name', 'fname'],
      lastName: ['last name', 'lastname', 'last_name', 'lname', 'surname'],
      address: ['address', 'street address', 'street_address', 'addr', 'address line 1', 'address_line_1'],
      city: ['city'],
      state: ['state'],
      zip: ['zip', 'zip code', 'zipcode', 'zip_code', 'postal code', 'postal_code'],
      phone: ['phone', 'phone number', 'phone_number', 'telephone', 'tel', 'mobile'],
      email: ['email', 'e-mail', 'email address', 'email_address'],
      npi: ['npi', 'npi #', 'npi_number', 'national provider identifier'],
      dea: ['dea', 'dea license', 'dea_license', 'dea number', 'dea_number'],
    };

    formFields.forEach((pdfField) => {
      const pdfFieldLower = pdfField.name.toLowerCase().trim();
      
      // Try to match PDF field to spreadsheet column
      for (const [patternKey, patterns] of Object.entries(fieldPatterns)) {
        for (const pattern of patterns) {
          if (pdfFieldLower.includes(pattern)) {
            // Find matching column in spreadsheet
            const matchingColumn = sheetColumns.find(col => {
              const colLower = col.toLowerCase().trim();
              return colLower.includes(pattern) || 
                     colLower.includes(patternKey) ||
                     patterns.some(p => colLower.includes(p));
            });
            
            if (matchingColumn) {
              mapping[pdfField.name] = matchingColumn;
              break;
            }
          }
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
    
    // Auto-update preview if provider is selected
    if (selectedPerson) {
      setTimeout(() => generatePreview(), 500); // Debounce
    }
  };

  const sheetColumns = people.length > 0 ? Object.keys(people[0]) : [];

  // Auto-map when both PDF fields and spreadsheet columns are available
  useEffect(() => {
    if (formFields.length > 0 && sheetColumns.length > 0 && Object.keys(fieldMapping).length === 0) {
      autoMapFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFields.length, sheetColumns.length]);

  // Generate preview when provider is selected and mapping exists
  useEffect(() => {
    if (selectedPerson && Object.keys(fieldMapping).length > 0 && pdfFile) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 300); // Debounce
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson, Object.keys(fieldMapping).length]);

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-blue-900 mb-1">Provider Compliance Dashboard</h1>
              <p className="text-blue-700 text-sm">PDF form automation tool</p>
            </div>
            <button
              onClick={() => setShowHowToUse(!showHowToUse)}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              {showHowToUse ? 'Hide Guide' : 'How to Use'}
            </button>
          </div>
        </header>

        {/* How to Use Section */}
        {showHowToUse && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">How to Use</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900 mb-1">Step 1: Upload PDF Form</h3>
                <p className="text-blue-700 text-sm">
                  Select your PDF form. The application will automatically detect all fillable fields.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900 mb-1">Step 2: Upload Provider Data</h3>
                <p className="text-blue-700 text-sm">
                  Upload your Provider Compliance Dashboard file (CSV or Excel). Column 1 will be used as the provider identifier. Alternatively, connect to Google Sheets.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900 mb-1">Step 3: Map Fields</h3>
                <p className="text-blue-700 text-sm">
                  Fields are automatically mapped when possible. Review and adjust mappings as needed. This only needs to be done once per PDF template.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900 mb-1">Step 4: Select Provider</h3>
                <p className="text-blue-700 text-sm">
                  Choose a provider from the dropdown. The form preview will update automatically with their information.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-900 mb-1">Step 5: Download</h3>
                <p className="text-blue-700 text-sm">
                  Review the preview, then download the filled PDF form.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left Column - PDF Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">1. Upload PDF Form</h2>
            
            <label className="block">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="block w-full text-sm text-blue-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </label>

            {pdfFile && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900">{pdfFile.name}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {formFields.length} fillable fields detected
                </p>
              </div>
            )}

            {formFields.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Form Fields</h3>
                <div className="max-h-64 overflow-y-auto bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="space-y-1">
                    {formFields.map((field, idx) => (
                      <div key={idx} className="text-sm text-blue-800 py-1">
                        {field.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Data Source */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">2. Connect Data Source</h2>
            
            {/* Data Source Toggle */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setDataSource('file')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  dataSource === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setDataSource('google')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  dataSource === 'google'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Google Sheets
              </button>
            </div>

            {/* File Upload Option */}
            {dataSource === 'file' && (
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Upload Provider Compliance Dashboard
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSpreadsheetUpload}
                  className="block w-full text-sm text-blue-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-xs text-blue-600 mt-2 mb-4">
                  Column 1 will be used as the provider identifier
                </p>
                {spreadsheetFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                    <p className="text-sm font-medium text-blue-900">{spreadsheetFile.name}</p>
                    {people.length > 0 && (
                      <p className="text-xs text-blue-700 mt-1">
                        {people.length} {people.length === 1 ? 'provider' : 'providers'} loaded
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Google Sheets Option */}
            {dataSource === 'google' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Google Sheet ID
                  </label>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="Enter Google Sheet ID"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-blue-600 mt-1">
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
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">{people.length} {people.length === 1 ? 'Provider' : 'Providers'} Loaded</h3>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Select Provider
                </label>
                <select
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    if (idx >= 0) {
                      setSelectedPerson(people[idx]);
                    } else {
                      setSelectedPerson(null);
                    }
                  }}
                  value={selectedPerson ? people.indexOf(selectedPerson).toString() : ''}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a provider</option>
                  {people.map((person, idx) => {
                    const firstColumnKey = Object.keys(person)[0];
                    const displayName = person[firstColumnKey] || person.name || person.Name || person['Fountain Email Address']?.split('@')[0] || `Provider ${idx + 1}`;
                    return (
                      <option key={idx} value={idx}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>

                {selectedPerson && (
                  <div className="mt-4 p-3 bg-white border border-blue-200 rounded-md">
                    <p className="text-xs font-medium text-blue-900 mb-2">Provider Information</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Object.entries(selectedPerson)
                        .filter(([key, value]) => value && String(value).trim())
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <p key={key} className="text-xs text-blue-700">
                            <span className="font-medium text-blue-900">{key}:</span> {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Field Mapping Section */}
        {formFields.length > 0 && sheetColumns.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">3. Map Fields</h2>
                <p className="text-sm text-blue-700 mt-1">
                  Fields are automatically mapped. Review and adjust as needed.
                </p>
              </div>
              <button
                onClick={autoMapFields}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium transition-colors"
              >
                Re-map Fields
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formFields.map((field) => (
                <div key={field.name} className="border border-blue-200 rounded-md p-3">
                  <label className="block text-xs font-medium text-blue-900 mb-1.5">
                    {field.name}
                  </label>
                  <select
                    value={fieldMapping[field.name] || ''}
                    onChange={(e) => updateMapping(field.name, e.target.value)}
                    className="w-full px-2 py-1.5 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Skip field</option>
                    {sheetColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Preview Section */}
        {previewUrl && selectedPerson && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-900">Form Preview</h2>
              {previewLoading && (
                <span className="text-xs text-blue-600">Updating...</span>
              )}
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Preview for <span className="font-medium text-blue-900">{(() => {
                const firstColumnKey = Object.keys(selectedPerson)[0];
                return selectedPerson[firstColumnKey] || selectedPerson.name || selectedPerson.Name || 'selected provider';
              })()}</span>
            </p>
            <div className="border border-blue-300 rounded-md overflow-hidden bg-blue-50" style={{ height: '600px' }}>
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
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Download Filled Form</h2>
              <p className="text-sm text-blue-700">
                Ready to generate <span className="font-medium">{pdfFile?.name}</span> with data from <span className="font-medium">{(() => {
                  const firstColumnKey = Object.keys(selectedPerson)[0];
                  return selectedPerson[firstColumnKey] || selectedPerson.name || selectedPerson.Name || 'selected provider';
                })()}</span>
              </p>
            </div>
            <button
              onClick={handleFillPdf}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Generating PDF...' : 'Download Filled PDF'}
            </button>
            {loading && (
              <p className="text-center text-xs text-blue-600 mt-2">Processing form data...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
