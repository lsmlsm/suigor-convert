import { NextRequest, NextResponse } from 'next/server';
import { pdf } from 'pdf-to-img';

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
    const document = await pdf(Buffer.from(fileBuffer), { scale: 2.0 });
    
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
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to JPG' },
      { status: 500 }
    );
  }
}