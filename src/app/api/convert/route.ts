import { NextRequest, NextResponse } from 'next/server';
import { pdf } from 'pdf-to-img';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }
    
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    try {
      const document = await pdf(buffer, { scale: 2.0 });
      
      const images: string[] = [];
      
      for await (const image of document) {
        const base64Image = `data:image/png;base64,${image.toString('base64')}`;
        images.push(base64Image);
      }
      
      return NextResponse.json({
        success: true,
        images,
        pageCount: images.length
      });
    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to process PDF. Make sure the file is not corrupted.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to JPG' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload a PDF.' },
    { status: 405 }
  );
}