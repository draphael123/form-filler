import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// Formatting function (inline to avoid import issues)
function autoFormat(fieldName: string, value: string): string {
  if (!value) return '';
  
  const fieldLower = fieldName.toLowerCase();
  
  // Phone formatting
  if (fieldLower.includes('phone') || fieldLower.includes('tel')) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }
  
  // Date formatting
  if (fieldLower.includes('date')) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } catch {}
  }
  
  // ZIP formatting
  if (fieldLower.includes('zip') || fieldLower.includes('postal')) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
  }
  
  // Email formatting
  if (fieldLower.includes('email')) {
    return value.toLowerCase().trim();
  }
  
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const personDataStr = formData.get('personData') as string;
    const fieldMappingStr = formData.get('fieldMapping') as string;

    if (!file || !personDataStr || !fieldMappingStr) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const personData = JSON.parse(personDataStr);
    const fieldMapping = JSON.parse(fieldMappingStr);

    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    // Fill each field based on mapping
    Object.entries(fieldMapping).forEach(([pdfFieldName, sheetColumn]) => {
      if (!sheetColumn) return; // Skip if no mapping

      try {
        const field = form.getField(pdfFieldName as string);
        let value = personData[sheetColumn as string];

        if (!value) return; // Skip if no data

        // Format the value based on field name
        value = autoFormat(pdfFieldName, String(value));

        // Only fill text fields (ignore checkboxes/radios as requested)
        if (field.constructor.name.includes('TextField')) {
          const textField = field as any;
          textField.setText(value);
        }
      } catch (error) {
        console.error(`Error filling field ${pdfFieldName}:`, error);
      }
    });

    // Flatten the form to make it read-only (optional)
    // form.flatten();

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer for NextResponse
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
      },
    });
  } catch (error) {
    console.error('Error filling PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fill PDF' },
      { status: 500 }
    );
  }
}
