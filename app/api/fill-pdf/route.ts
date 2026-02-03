import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

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
        const value = personData[sheetColumn as string];

        if (!value) return; // Skip if no data

        // Only fill text fields (ignore checkboxes/radios as requested)
        if (field.constructor.name.includes('TextField')) {
          const textField = field as any;
          textField.setText(String(value));
        }
      } catch (error) {
        console.error(`Error filling field ${pdfFieldName}:`, error);
      }
    });

    // Flatten the form to make it read-only (optional)
    // form.flatten();

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
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
