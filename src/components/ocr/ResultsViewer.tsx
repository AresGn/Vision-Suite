import React, { useState } from 'react';
import type { TesseractResult } from '../../types/ocr.types';

interface ResultsViewerProps {
  result: TesseractResult;
}

type Tab = 'processed' | 'raw' | 'data';

const ResultsViewer: React.FC<ResultsViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<Tab>('processed');

  const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
        activeTab === tabName
          ? 'bg-slate-700 text-sky-400 border-b-2 border-sky-400'
          : 'text-slate-400 hover:bg-slate-700/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-slate-700">
        <TabButton tabName="processed" label="Processed Text" />
        <TabButton tabName="raw" label="Raw Text" />
        <TabButton tabName="data" label="Extracted Data (Simple)" />
      </div>
      <div className="flex-grow bg-slate-900/70 p-3 rounded-b-md border border-t-0 border-slate-700 overflow-y-auto">
        {activeTab === 'processed' && <pre className="whitespace-pre-wrap font-sans text-sm">{result.processedText || "No text processed."}</pre>}
        {activeTab === 'raw' && <pre className="whitespace-pre-wrap font-sans text-sm text-slate-400">{result.rawText || "No text detected."}</pre>}
        {activeTab === 'data' && (
          <pre className="text-sm text-green-300 bg-black/30 p-2 rounded whitespace-pre-wrap">
            {JSON.stringify(result.extractedFields, null, 2)}
          </pre>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center mt-2 text-xs">
        <div className="bg-slate-700/50 p-2 rounded">
            <p className="text-slate-400">Confidence</p>
            <p className="font-bold text-lg text-sky-400">{result.confidence.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-700/50 p-2 rounded">
            <p className="text-slate-400">Processing Time</p>
            <p className="font-bold text-lg text-sky-400">{(result.processingTime / 1000).toFixed(2)}s</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsViewer;