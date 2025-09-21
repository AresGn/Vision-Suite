import React from 'react';
import type { StructuredDocument } from '../../types/ocr.types';

interface StructuredResultsViewerProps {
  result: StructuredDocument;
}

const StructuredResultsViewer: React.FC<StructuredResultsViewerProps> = ({ result }) => {
  const { documentType, confidence, extractedFields, dataQuality, correctedText } = result;

  const renderField = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-700/50">
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="text-sm text-slate-200 col-span-2">{value}</dd>
      </div>
    );
  };
  
  const renderList = (label: string, items: string[] | null | undefined) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-700/50">
            <dt className="text-sm font-medium text-slate-400">{label}</dt>
            <dd className="text-sm text-slate-200 col-span-2">
                <ul className="list-disc list-inside">
                    {items.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </dd>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-sky-400">AI Enhanced Analysis</h3>
        <div className="text-right">
            <p className="text-sm text-slate-400">Document Type</p>
            <p className="font-semibold text-lg">{documentType || 'N/A'}</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <section>
          <h4 className="font-semibold text-slate-300 mb-2">Extracted Information</h4>
          <dl>
            {renderField('Full Name', extractedFields.fullName)}
            {renderField('First Name', extractedFields.firstName)}
            {renderField('Last Name', extractedFields.lastName)}
            {renderField('Document Number', extractedFields.documentNumber)}
            {renderField('Date of Birth', extractedFields.birthDate)}
            {renderField('Place of Birth', extractedFields.birthPlace)}
            {renderField('Nationality', extractedFields.nationality)}
            {renderField('Issue Date', extractedFields.issueDate)}
            {renderField('Expiry Date', extractedFields.expiryDate)}
            {renderField('Issuing Authority', extractedFields.issuingAuthority)}
          </dl>
        </section>

        {dataQuality && (
            <section>
                <h4 className="font-semibold text-slate-300 mb-2">Data Quality Assessment</h4>
                <dl>
                    {renderField('Overall Confidence', dataQuality.overallConfidence ? `${(dataQuality.overallConfidence * 100).toFixed(1)}%` : 'N/A')}
                    {renderList('Possible Errors', dataQuality.possibleErrors)}
                    {renderList('Suggestions', dataQuality.suggestions)}
                </dl>
            </section>
        )}
        
        <section>
          <h4 className="font-semibold text-slate-300 mb-2">AI Corrected Text</h4>
          <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-900/70 p-3 rounded-md border border-slate-700">
            {correctedText}
          </pre>
        </section>
      </div>
      
       <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-700">
            <p>AI Analysis Confidence: <span className="font-bold text-slate-400">{(confidence * 100).toFixed(1)}%</span></p>
       </div>
    </div>
  );
};

export default StructuredResultsViewer;