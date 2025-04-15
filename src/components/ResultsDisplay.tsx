import React from 'react';
import Latex from 'react-latex';
import { Copy, Download } from 'lucide-react';
import { OCRResult } from '../types';

interface ResultsDisplayProps {
  result: OCRResult;
  onExport: (format: 'pdf' | 'txt' | 'latex') => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = (format: 'pdf' | 'txt' | 'latex') => {
    const content = result.text;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = `scanned-text-${timestamp}`;
    let data: string;
    let mimeType: string;

    switch (format) {
      case 'txt':
        filename += '.txt';
        data = content;
        mimeType = 'text/plain';
        break;
      case 'latex':
        filename += '.tex';
        // Basic LaTeX document structure
        data = `\\documentclass{article}
\\begin{document}
${content}
\\end{document}`;
        mimeType = 'application/x-tex';
        break;
      case 'pdf':
        // For PDF, we'll create a simple HTML that can be printed to PDF
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Scanned Document</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2cm; }
    .content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="content">${content}</div>
</body>
</html>`;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
        return;
    }

    // Create and trigger download
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Extracted Text */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Extracted Text</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(result.text)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Copy text"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{result.text}</p>
        <div className="mt-2 text-sm text-gray-500">
          Confidence: {(result.confidence * 100).toFixed(1)}%
        </div>
      </div>

      {/* Font Information */}
      {result.fonts && result.fonts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Detected Fonts</h3>
          <div className="space-y-2">
            {result.fonts.map((font, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">{font.name}</span>
                <span className="text-sm text-gray-500">
                  {(font.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mathematical Equations */}
      {result.equations && result.equations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Mathematical Equations</h3>
          <div className="space-y-4">
            {result.equations.map((eq, index) => (
              <div key={index} className="space-y-2">
                <Latex>{eq.latex}</Latex>
                <div className="text-sm text-gray-500">
                  Confidence: {(eq.confidence * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="flex space-x-4">
        {['pdf', 'txt', 'latex'].map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format as 'pdf' | 'txt' | 'latex')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg
                     hover:bg-gray-200 transition-colors text-gray-700"
          >
            <Download className="w-4 h-4" />
            <span className="uppercase">{format}</span>
          </button>
        ))}
      </div>
    </div>
  );
};