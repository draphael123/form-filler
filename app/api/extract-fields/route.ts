import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const fieldData = fields.map(field => {
      const fieldName = field.getName();
      let fieldType = 'text';

      // Determine field type
      if (field.constructor.name.includes('CheckBox')) {
        fieldType = 'checkbox';
      } else if (field.constructor.name.includes('Radio')) {
        fieldType = 'radio';
      } else if (field.constructor.name.includes('Dropdown')) {
        fieldType = 'dropdown';
      } else if (field.constructor.name.includes('TextField')) {
        fieldType = 'text';
      }

      return {
        name: fieldName,
        type: fieldType,
      };
    });

    return NextResponse.json({ fields: fieldData });
  } catch (error) {
    console.error('Error extracting PDF fields:', error);
    return NextResponse.json(
      { error: 'Failed to extract PDF fields' },
      { status: 500 }
    );
  }
}
