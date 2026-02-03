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
      setPeople(data.people);
    } catch (error) {
      console.error('Error fetching people:', error);
      alert('Error fetching Google Sheets data');
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">PDF Form Filler</h1>
        <p className="text-gray-600 mb-8">Fountain Provider Onboarding Tool</p>

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

          {/* Right Column - Google Sheets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">2. Connect Data Source</h2>
            
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
              {loading ? 'Fetching...' : 'Fetch People Data'}
            </button>

            {people.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-gray-700">Select Person:</h3>
                <select
                  onChange={(e) => setSelectedPerson(people[parseInt(e.target.value)])}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose a person --</option>
                  {people.map((person, idx) => (
                    <option key={idx} value={idx}>
                      {person.name || person.Name || `Person ${idx + 1}`}
                    </option>
                  ))}
                </select>

                {selectedPerson && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Selected Data:</p>
                    {Object.entries(selectedPerson).map(([key, value]) => (
                      <p key={key} className="text-xs text-gray-700">
                        <strong>{key}:</strong> {value}
                      </p>
                    ))}
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
              Match PDF form fields to your Google Sheet columns:
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
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <button
              onClick={handleFillPdf}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:from-pink-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Filling PDF...' : '🚀 Fill PDF Form'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
