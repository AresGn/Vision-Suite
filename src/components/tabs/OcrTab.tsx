import React, { useState, useCallback, useEffect } from 'react';
import ImageDropzone from '../ui/ImageDropzone';
import Spinner from '../ui/Spinner';
import LanguageSelector from '../ocr/LanguageSelector';
import ResultsViewer from '../ocr/ResultsViewer';
import ExportOptions from '../ocr/ExportOptions';
import StructuredResultsViewer from '../ocr/StructuredResultsViewer';
import { preprocessImage } from '../../services/documentProcessor';
import { recognizeText, terminateWorker } from '../../services/ocrService';
import { analyzeOcrText } from '../../services/geminiService';
import type { OcrLanguage, TesseractResult, StructuredDocument } from '../../types/ocr.types';

const OcrTab: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>('eng+fra');
  const [tesseractResult, setTesseractResult] = useState<TesseractResult | null>(null);
  const [geminiResult, setGeminiResult] = useState<StructuredDocument | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ status: '', value: 0 });
  const [enablePreprocessing, setEnablePreprocessing] = useState(true);

  useEffect(() => {
    return () => { terminateWorker(); };
  }, []);

  const resetState = () => {
    setImage(null);
    setPreview(null);
    setTesseractResult(null);
    setGeminiResult(null);
    setError(null);
    setIsLoading(false);
    setIsEnhancing(false);
    setProgress({ status: '', value: 0 });
  };

  const handleImageDrop = useCallback((file: File | null) => {
    resetState();
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);
  
  const handleExtract = async () => {
    if (!image) {
      setError('Please upload an image document.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setTesseractResult(null);
    setGeminiResult(null);
    setProgress({ status: 'Initializing...', value: 0 });

    try {
      const imageSource = enablePreprocessing ? await preprocessImage(image) : image;
      const ocrResult = await recognizeText(imageSource, language, (p) => {
         // The progress value from the service is already a percentage (0-100).
         setProgress({ status: p.status, value: p.progress });
      });
      setTesseractResult(ocrResult);
    } catch (err: any) {
      setError(`OCR Error: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress({ status: 'Complete', value: 100 });
    }
  };
  
  const handleEnhanceWithAI = async () => {
    if (!tesseractResult?.rawText) {
        setError("Cannot enhance without initial OCR text.");
        return;
    }
    setError(null);
    setIsEnhancing(true);
    try {
        const structuredResult = await analyzeOcrText(tesseractResult.rawText);
        setGeminiResult(structuredResult);
    } catch(err: any) {
        setError(`AI Enhancement Error: ${err.message || 'Unknown error'}`);
        console.error(err);
    } finally {
        setIsEnhancing(false);
    }
  };

  const ProgressTracker = () => {
     if (!isLoading) return null;
     const statusText = progress.status.charAt(0).toUpperCase() + progress.status.slice(1).replace(/_/g, ' ');
     return (
        <div className="space-y-1">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress.value}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>
            <p className="text-xs text-slate-400 text-center">{statusText} ({progress.value}%)</p>
        </div>
     );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <ImageDropzone onImageDrop={handleImageDrop} imagePreviewUrl={preview} id="ocr-image-upload" />
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-4">
          <LanguageSelector language={language} setLanguage={setLanguage} disabled={isLoading || isEnhancing} />
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={enablePreprocessing} 
              onChange={(e) => setEnablePreprocessing(e.target.checked)} 
              disabled={isLoading || isEnhancing}
              className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"
            />
            <span className="text-slate-300 text-sm">Enable Image Preprocessing (Improves Accuracy)</span>
          </label>
          <div className="flex space-x-4">
            <button
              onClick={handleExtract}
              disabled={!image || isLoading || isEnhancing}
              className="flex-grow py-2.5 px-5 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
            >
              {isLoading ? <Spinner size="sm" /> : '1. Extract Text (OCR)'}
            </button>
            <button
              onClick={resetState}
              className="py-2.5 px-5 bg-red-700/80 text-white font-semibold rounded-lg shadow-md hover:bg-red-600"
            >
              Clear
            </button>
          </div>
        </div>
        <ProgressTracker />
        {error && <p className="text-red-400 text-center bg-red-900/50 p-2 rounded-md">{error}</p>}
      </div>

      <div className="flex flex-col bg-slate-800/50 p-4 rounded-lg min-h-[500px]">
        {!tesseractResult && !geminiResult && (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Extraction results will appear here.</p>
            </div>
        )}
        
        {tesseractResult && (
            <>
                {geminiResult ? (
                    <StructuredResultsViewer result={geminiResult} />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">OCR Result</h3>
                             <button onClick={handleEnhanceWithAI} disabled={isEnhancing} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors flex items-center">
                               {isEnhancing ? <Spinner size="sm"/> : '✨ 2. Enhance with AI'}
                             </button>
                        </div>
                        <ResultsViewer result={tesseractResult} />
                        <ExportOptions result={tesseractResult} imageName={image?.name || 'export'} disabled={!tesseractResult} />
                    </>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default OcrTab;