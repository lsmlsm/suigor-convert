import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface CreateSVGOptions {
  width?: number;
  height?: number;
  padding?: number;
  fontSize?: number;
}

function createSVG(text: string, options: CreateSVGOptions = {}): string {
  const width = options.width || 800;
  const height = options.height || 600;
  const padding = options.padding || 40;
  const fontSize = options.fontSize || 16;
  const lineHeight = fontSize * 1.8;
  
  // Parse text and handle LaTeX notation
  const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
  let y = padding + fontSize;
  let svgContent = '';
  
  parts.forEach((part) => {
    if (part.trim() === '') return;
    
    // Block math
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const math = part.slice(2, -2).trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;');
      y += lineHeight * 0.5;
      svgContent += `<text x="${width/2}" y="${y}" text-anchor="middle" fill="#2563eb" font-size="${fontSize + 2}" font-family="Arial">${math}</text>`;
      y += lineHeight * 2;
    }
    // Inline math
    else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const math = part.slice(2, -2).trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;');
      svgContent += `<text x="${padding}" y="${y}" fill="#2563eb" font-size="${fontSize}" font-family="Arial">${math}</text>`;
      y += lineHeight;
    }
    // Regular text
    else {
      const lines = part.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          // Handle bold text
          const processedLine = line
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/&/g, '&amp;')
            .replace(/\*([^*]+)\*/g, '<tspan font-weight="bold">$1</tspan>');
          
          svgContent += `<text x="${padding}" y="${y}" fill="#000000" font-size="${fontSize}" font-family="Arial">${processedLine}</text>`;
        }
        y += lineHeight;
      });
    }
  });
  
  // Calculate actual height needed
  const actualHeight = Math.max(height, y + padding);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${actualHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${actualHeight}" fill="white"/>
  ${svgContent}
</svg>`;
}

export async function POST(request: NextRequest) {
  try {
    const { text, options = {} } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Create SVG
    const svg = createSVG(text, options);
    const svgBuffer = Buffer.from(svg);

    // Convert SVG to JPEG using Sharp
    const jpegBuffer = await sharp(svgBuffer)
      .jpeg({ quality: 95 })
      .toBuffer();

    // Return JPEG as response
    return new NextResponse(jpegBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="math-formulas.jpg"',
      },
    });

  } catch (error) {
    console.error('JPG generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate JPG',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST with JSON body containing "text" field.',
      example: {
        text: "The quadratic formula is \\\\[ x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a} \\\\]",
        options: {
          width: 800,
          height: 600,
          fontSize: 16,
          padding: 40
        }
      }
    },
    { status: 405 }
  );
}