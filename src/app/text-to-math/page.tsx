'use client';

import { useState, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function TextToMath() {
  const [inputText, setInputText] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const exampleText = `好，我幫你計下呢題經濟學題目，條數都幾直白。

*已知：*  
•⁠  ⁠消費：C = 10 + 0.8(Y - T)
•⁠  ⁠投資：I = 10  
•⁠  ⁠政府開支：G = 10  
•⁠  ⁠稅收：T = 10  
•⁠  ⁠進口：IM = 0.3Y  
•⁠  ⁠出口：X = 0.3Y*  
•⁠  ⁠實質匯率 = 1（固定）  
•⁠  ⁠Y* 係外國產出  

*本地產出（Y）嘅均衡公式：*
\\[ Y = C + I + G + X - IM \\]

代入數值：  
C = 10 + 0.8(Y - 10) = 10 + 0.8Y - 8 = 0.8Y + 2  
I = 10  
G = 10  
X = 0.3Y*  
IM = 0.3Y  

將所有數值帶返入去：
\\[ Y = (0.8Y + 2) + 10 + 10 + 0.3Y^* - 0.3Y \\]
\\[ Y = 0.8Y - 0.3Y + 2 + 10 + 10 + 0.3Y^* \\]
\\[ Y = 0.5Y + 22 + 0.3Y^* \\]

將 Y 移到一邊：
\\[ Y - 0.5Y = 22 + 0.3Y^* \\]
\\[ 0.5Y = 22 + 0.3Y^* \\]
\\[ Y = 44 + 0.6Y^* \\]

*答案：*  
本地均衡產出 \\( Y = 44 + 0.6Y^* \\)

如果外國經濟好啲，自己都跟住旺！經濟都幾現實吓～`;

  const parseAndRenderMath = (text: string) => {
    // Split text by math delimiters
    const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
    
    return parts.map((part, index) => {
      // Check for block math \\[ ... \\]
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const math = part.slice(2, -2).trim();
        return (
          <div key={index} className="my-4">
            <BlockMath math={math} />
          </div>
        );
      }
      
      // Check for inline math \\( ... \\)
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const math = part.slice(2, -2).trim();
        return <InlineMath key={index} math={math} />;
      }
      
      // Regular text with formatting
      return (
        <span key={index}>
          {part.split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              {formatTextLine(line)}
            </span>
          ))}
        </span>
      );
    });
  };

  const formatTextLine = (line: string) => {
    // Replace *bold* with <strong>
    line = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    
    // Replace _italic_ with <em>
    line = line.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    return <span dangerouslySetInnerHTML={{ __html: line }} />;
  };

  const handleConvert = () => {
    setConvertedText(inputText);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(inputText);
    alert('LaTeX code copied to clipboard!');
  };

  const handleLoadExample = () => {
    setInputText(exampleText);
    setConvertedText(exampleText);
  };

  const handleClear = () => {
    setInputText('');
    setConvertedText('');
  };

  const handleExportToPDF = async () => {
    if (!convertedText) return;
    
    setIsExporting(true);
    try {
      const response = await fetch('/api/text-to-latex-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: convertedText,
          options: {
            fontSize: 12,
            margin: 50
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'math-formulas.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToJPG = async () => {
    if (!convertedText) return;
    
    setIsExporting(true);
    try {
      const response = await fetch('/api/text-to-jpg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: convertedText,
          options: {
            width: 800,
            height: 600,
            fontSize: 16,
            padding: 40
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate JPG');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'math-formulas.jpg';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JPG:', error);
      alert('Failed to export to JPG');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Text to Math Formula Converter
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Convert text with LaTeX notation to beautifully formatted mathematical formulas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Input Text
              </h2>
              <div className="space-x-2">
                <button
                  onClick={handleLoadExample}
                  className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                >
                  Load Example
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter text with LaTeX notation...

Example:
The quadratic formula is \\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]

For inline math, use \\( E = mc^2 \\)`}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       font-mono text-sm resize-none"
            />
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleConvert}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Convert to Math
              </button>
              
              <button
                onClick={handleCopyLatex}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Copy LaTeX
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Formatted Output
              </h2>
              <div className="flex items-center space-x-4">
                {convertedText && showPreview && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExportToPDF}
                      disabled={isExporting}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isExporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                    <button
                      onClick={handleExportToJPG}
                      disabled={isExporting}
                      className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isExporting ? 'Exporting...' : 'Export JPG'}
                    </button>
                  </div>
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show Preview
                  </span>
                </label>
              </div>
            </div>
            
            <div className="h-96 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 
                          bg-gray-50 dark:bg-gray-700">
              {showPreview && convertedText ? (
                <div ref={outputRef} className="prose prose-lg dark:prose-invert max-w-none bg-white p-4 rounded">
                  {parseAndRenderMath(convertedText)}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center mt-32">
                  {!showPreview ? 'Preview disabled' : 'Enter text and click "Convert to Math" to see the formatted output'}
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-semibold mb-2">Quick Reference:</p>
              <ul className="space-y-1">
                <li>• Block math: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`\\[ ... \\]`}</code></li>
                <li>• Inline math: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`\\( ... \\)`}</code></li>
                <li>• Superscript: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`x^2`}</code> or <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`x^{10}`}</code></li>
                <li>• Subscript: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`x_1`}</code> or <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`x_{10}`}</code></li>
                <li>• Fraction: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`\\frac{a}{b}`}</code></li>
                <li>• Square root: <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{`\\sqrt{x}`}</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Common Math Formulas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quadratic Formula</p>
              <BlockMath math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pythagorean Theorem</p>
              <BlockMath math="a^2 + b^2 = c^2" />
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Euler's Identity</p>
              <BlockMath math="e^{i\pi} + 1 = 0" />
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Derivative</p>
              <BlockMath math="\frac{d}{dx}f(x) = \lim_{h \to 0}\frac{f(x+h) - f(x)}{h}" />
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Integral</p>
              <BlockMath math="\int_a^b f(x)\,dx = F(b) - F(a)" />
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Normal Distribution</p>
              <BlockMath math="f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}