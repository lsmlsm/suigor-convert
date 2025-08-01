import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ParsedContent {
  type: 'text' | 'math-block' | 'math-inline';
  content: string;
}

function parseTextContent(text: string): ParsedContent[] {
  const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
  const parsed: ParsedContent[] = [];

  parts.forEach((part) => {
    if (part.trim() === '') return;

    // Block math
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const math = part.slice(2, -2).trim();
      parsed.push({
        type: 'math-block',
        content: math,
      });
    }
    // Inline math
    else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const math = part.slice(2, -2).trim();
      parsed.push({
        type: 'math-inline',
        content: math,
      });
    }
    // Regular text
    else {
      parsed.push({
        type: 'text',
        content: part,
      });
    }
  });

  return parsed;
}

// Function to clean text and preserve structure
function prepareTextForPDF(text: string): string {
  // Preserve structure but mark Chinese text
  let result = text;
  
  // Handle Chinese characters by replacing with a marker
  const chineseRegex = /[\u4e00-\u9fff]+/g;
  const matches = text.match(chineseRegex);
  
  if (matches) {
    matches.forEach(match => {
      result = result.replace(match, `[${match}]`);
    });
  }
  
  // Clean up special Unicode characters
  result = result
    .replace(/•⁠\s*/g, '• ')  // Clean bullet points
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/[\u2028\u2029]/g, '\n'); // Replace Unicode line separators
  
  return result;
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

    // Create a new PDF document using jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // Page settings
    const margin = options.margin || 50;
    const fontSize = options.fontSize || 12;
    const lineHeight = fontSize * 1.5;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Parse content
    const parsedContent = parseTextContent(text);

    // Helper function to check if we need a new page
    const checkNewPage = () => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with word wrap
    const addTextWithWrap = (text: string, x: number, y: number, options: any = {}) => {
      const preparedText = prepareTextForPDF(text);
      const lines = pdf.splitTextToSize(preparedText, maxWidth);
      let currentY = y;
      
      lines.forEach((line: string) => {
        checkNewPage();
        
        if (options.align === 'center') {
          const textWidth = pdf.getTextWidth(line);
          const centerX = (pageWidth - textWidth) / 2;
          pdf.text(line, centerX, currentY);
        } else {
          pdf.text(line, x, currentY);
        }
        
        currentY += lineHeight;
      });
      
      return currentY;
    };

    // Process parsed content
    for (const item of parsedContent) {
      if (item.type === 'text') {
        const lines = item.content.split('\n');
        
        for (const line of lines) {
          const preparedLine = prepareTextForPDF(line);
          
          if (preparedLine.trim()) {
            // Handle bullet points
            if (preparedLine.trim().startsWith('•')) {
              checkNewPage();
              pdf.text('•', margin, yPosition);
              const bulletText = preparedLine.trim().substring(1).trim();
              
              if (bulletText) {
                const wrappedLines = pdf.splitTextToSize(bulletText, maxWidth - 20);
                wrappedLines.forEach((wLine: string, index: number) => {
                  if (index > 0) {
                    yPosition += lineHeight;
                    checkNewPage();
                  }
                  pdf.text(wLine, margin + 20, yPosition);
                });
              }
              yPosition += lineHeight;
            }
            // Handle bold text
            else if (preparedLine.includes('*') && preparedLine.match(/\*([^*]+)\*/)) {
              checkNewPage();
              const parts = preparedLine.split(/\*([^*]+)\*/g);
              let xOffset = margin;
              
              parts.forEach((part, index) => {
                if (part) {
                  if (index % 2 === 1) {
                    pdf.setFont('helvetica', 'bold');
                  } else {
                    pdf.setFont('helvetica', 'normal');
                  }
                  
                  pdf.text(part, xOffset, yPosition);
                  xOffset += pdf.getTextWidth(part);
                }
              });
              pdf.setFont('helvetica', 'normal');
              yPosition += lineHeight;
            }
            // Regular text
            else {
              yPosition = addTextWithWrap(preparedLine, margin, yPosition);
            }
          } else {
            // Empty line - add some spacing
            yPosition += lineHeight * 0.5;
          }
        }
      } else if (item.type === 'math-block') {
        // Add extra space before math
        yPosition += lineHeight * 0.5;
        checkNewPage();
        
        // Set blue color for math
        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(fontSize + 2);
        
        yPosition = addTextWithWrap(item.content, margin, yPosition, { align: 'center' });
        
        // Reset color and size
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(fontSize);
        
        // Add extra space after math
        yPosition += lineHeight * 0.5;
      } else if (item.type === 'math-inline') {
        checkNewPage();
        
        // Set blue color for math
        pdf.setTextColor(37, 99, 235);
        
        yPosition = addTextWithWrap(item.content, margin, yPosition);
        
        // Reset color
        pdf.setTextColor(0, 0, 0);
      }
    }

    // Get PDF as buffer
    const pdfOutput = pdf.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfOutput);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="math-formulas.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
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
        text: "The quadratic formula is \\\\[ x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a} \\\\]\\n\\nFor inline math: \\\\( E = mc^2 \\\\)",
        options: {
          fontSize: 12,
          margin: 50
        }
      }
    },
    { status: 405 }
  );
}