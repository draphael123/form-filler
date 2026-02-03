'use client';

import { useState } from 'react';

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

  // Update field mapping
  const updateMapping = (pdfField: string, sheetColumn: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [pdfField]: sheetColumn,
    }));
  };

  const sheetColumns = people.length > 0 ? Object.keys(people[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Provider Compliance Dashboard</h1>
            <p className="text-gray-600">PDF Form Filler - Select a provider from Column 1 to fill forms</p>
          </div>
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            {showHowToUse ? '✕ Hide' : '❓ How to Use'}
          </button>
        </div>

        {/* How to Use Section */}
        {showHowToUse && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-2 border-blue-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 How to Use This Tool</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-lg text-blue-800 mb-2">Step 1: Upload Your PDF Form</h3>
                <p className="text-gray-700 text-sm">
                  Click "Choose File" and select your PDF form (like "Belmar Form"). The app will automatically detect all fillable fields.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-lg text-green-800 mb-2">Step 2: Upload Provider Compliance Dashboard</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Click "📄 Upload File" and select your Provider Compliance Dashboard CSV or Excel file. <strong>Column 1 will be used as the provider identifier.</strong>
                </p>
                <p className="text-xs text-gray-600 italic">
                  💡 Tip: You can also use Google Sheets by clicking the "🔗 Google Sheets" button.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-lg text-purple-800 mb-2">Step 3: Map Fields (One-Time Setup)</h3>
                <p className="text-gray-700 text-sm">
                  Match each PDF field to the corresponding column in your spreadsheet. For example: PDF field "Provider Name" → Spreadsheet column "Name". You only need to do this once per PDF template.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-semibold text-lg text-orange-800 mb-2">Step 4: Select a Provider 👤</h3>
                <p className="text-gray-700 text-sm mb-2">
                  After your Provider Compliance Dashboard loads, a dropdown will appear with all providers (using Column 1 as identifier). <strong>Select the provider</strong> you want to fill the PDF for.
                </p>
                <p className="text-xs text-gray-600 italic">
                  💡 You'll see their information preview below the dropdown.
                </p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg border-l-4 border-pink-500">
                <h3 className="font-semibold text-lg text-pink-800 mb-2">Step 5: Fill & Download 🚀</h3>
                <p className="text-gray-700 text-sm">
                  Click the "🚀 Fill PDF & Download" button. The PDF will be automatically filled with the selected person's data and download to your computer!
                </p>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <h4 className="font-semibold text-gray-800 mb-2">💡 Quick Tips:</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>You can fill multiple PDFs - just select a different person each time</li>
                  <li>Field mapping is saved during your session (until you refresh the page)</li>
                  <li>Only text fields are filled - checkboxes are excluded</li>
                  <li>Empty cells in your spreadsheet will leave PDF fields blank</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Spreadsheet Format:</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Your spreadsheet should have:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li><strong>First row = Column headers</strong> (Name, Email, Address, etc.)</li>
                  <li><strong>Each row = One person/provider</strong></li>
                  <li><strong>Supported formats:</strong> CSV (.csv) or Excel (.xlsx, .xls)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - PDF Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-pink-600">1. Upload PDF Form</h2>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="mb-4 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
            />

            {pdfFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">✓ {pdfFile.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Found {formFields.length} fields (checkboxes excluded)
                </p>
              </div>
            )}

            {formFields.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-gray-700">PDF Form Fields:</h3>
                <div className="max-h-64 overflow-y-auto bg-gray-50 p-3 rounded">
                  {formFields.map((field, idx) => (
                    <div key={idx} className="text-sm py-1 text-gray-700">
                      • {field.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Data Source */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">2. Connect Data Source</h2>
            
            {/* Data Source Toggle */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setDataSource('file')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  dataSource === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📄 Upload File
              </button>
              <button
                onClick={() => setDataSource('google')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  dataSource === 'google'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔗 Google Sheets
              </button>
            </div>

            {/* File Upload Option */}
            {dataSource === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Provider Compliance Dashboard (CSV or Excel):
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSpreadsheetUpload}
                  className="mb-2 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mb-4">
                  Upload your Provider Compliance Dashboard file. <strong>Column 1 will be used as the provider identifier.</strong>
                </p>
                {spreadsheetFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
                    <p className="text-sm text-green-800 font-semibold">✓ {spreadsheetFile.name}</p>
                    {people.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        ✅ Loaded {people.length} {people.length === 1 ? 'person' : 'people'} from spreadsheet
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Sheet ID:
                  </label>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="Paste your Google Sheet ID here"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in your Sheet URL: docs.google.com/spreadsheets/d/<strong>[SHEET_ID]</strong>/edit
                  </p>
                </div>

                <button
                  onClick={handleFetchPeople}
                  disabled={loading || !sheetId}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Fetching...' : 'Fetch Provider Data'}
                </button>
              </div>
            )}

            {people.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800 text-lg">✅ {people.length} {people.length === 1 ? 'Provider' : 'Providers'} Loaded from Column 1</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Select Provider (Column 1) to Fill PDF:
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
                  className="w-full p-3 border-2 border-green-400 rounded-lg focus:border-green-600 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose a provider from Column 1 --</option>
                  {people.map((person, idx) => {
                    // Use Column 1 (first column) as the person identifier
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
                  <div className="mt-4 p-4 bg-white border-2 border-green-400 rounded-lg">
                    <p className="text-sm font-bold text-green-800 mb-3">📋 Selected Provider's Information (from Column 1):</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Object.entries(selectedPerson)
                        .filter(([key, value]) => value && String(value).trim())
                        .slice(0, 10) // Show first 10 fields
                        .map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-700">
                            <strong className="text-green-700">{key}:</strong> <span className="text-gray-800">{String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}</span>
                          </p>
                        ))}
                      {Object.keys(selectedPerson).filter(key => selectedPerson[key] && String(selectedPerson[key]).trim()).length > 10 && (
                        <p className="text-xs text-gray-500 italic">... and {Object.keys(selectedPerson).filter(key => selectedPerson[key] && String(selectedPerson[key]).trim()).length - 10} more fields</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Field Mapping Section */}
        {formFields.length > 0 && sheetColumns.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-purple-600">3. Map Fields</h2>
            <p className="text-sm text-gray-600 mb-4">
              Match PDF form fields to your spreadsheet columns:
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formFields.map((field) => (
                <div key={field.name} className="border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.name}
                  </label>
                  <select
                    value={fieldMapping[field.name] || ''}
                    onChange={(e) => updateMapping(field.name, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none text-sm"
                  >
                    <option value="">-- Skip this field --</option>
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

        {/* Fill PDF Button */}
        {selectedPerson && formFields.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border-2 border-green-400">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">4. Fill PDF with Selected Person</h2>
              <p className="text-sm text-gray-600">
                Ready to fill <strong className="text-green-700">{pdfFile?.name}</strong> with data from <strong className="text-blue-700">{(() => {
                  const firstColumnKey = Object.keys(selectedPerson)[0];
                  return selectedPerson[firstColumnKey] || selectedPerson.name || selectedPerson.Name || 'selected provider';
                })()}</strong>
              </p>
            </div>
            <button
              onClick={handleFillPdf}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:from-pink-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? '⏳ Filling PDF...' : '🚀 Fill PDF & Download'}
            </button>
            {loading && (
              <p className="text-center text-sm text-gray-500 mt-2">Processing your PDF...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
