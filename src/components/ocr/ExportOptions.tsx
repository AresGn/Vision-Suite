import React from 'react';
import type { TesseractResult } from '../../types/ocr.types';

interface ExportOptionsProps {
  result: TesseractResult;
  imageName: string;
  disabled: boolean;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ result, imageName, disabled }) => {
  const handleExport = (format: 'txt' | 'json') => {
    if (!result || disabled) return;
    const baseName = imageName.split('.').slice(0, -1).join('.') || 'ocr_export';
    let blob;
    let filename;

    if (format === 'txt') {
      blob = new Blob([result.processedText], { type: 'text/plain;charset=utf-8' });
      filename = `${baseName}.txt`;
    } else { // json
      blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      filename = `${baseName}_tesseract.json`;
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-slate-400">Export Raw OCR Result</h3>
        <div className="space-x-2">
            <button onClick={() => handleExport('txt')} disabled={disabled} className="text-sm px-3 py-1 bg-slate-600 rounded-md hover:bg-slate-500 disabled:opacity-50 transition-colors">
                Save as .txt
            </button>
            <button onClick={() => handleExport('json')} disabled={disabled} className="text-sm px-3 py-1 bg-slate-600 rounded-md hover:bg-slate-500 disabled:opacity-50 transition-colors">
                Save as .json
            </button>
        </div>
    </div>
  );
};

export default ExportOptions;