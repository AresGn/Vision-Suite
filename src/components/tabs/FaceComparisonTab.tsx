import React, { useState, useCallback, useMemo } from 'react';
import ImageDropzone from '../ui/ImageDropzone';
import { compareFaces } from '../../services/analysisService';
import Spinner from '../ui/Spinner';
import type { FaceComparisonResult } from '../../types';

interface FaceComparisonTabProps {
  modelsLoaded: boolean;
}

const FaceComparisonTab: React.FC<FaceComparisonTabProps> = ({ modelsLoaded }) => {
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50); // face-api.js distance threshold is ~0.6, so similarity ~40+ is good
  const [result, setResult] = useState<FaceComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageDrop = useCallback((file: File | null, imageIndex: 1 | 2) => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (imageIndex === 1) {
        setImage1(file);
        setPreview1(url);
      } else {
        setImage2(file);
        setPreview2(url);
      }
    } else {
       if (imageIndex === 1) {
        setImage1(null);
        setPreview1(null);
      } else {
        setImage2(null);
        setPreview2(null);
      }
    }
    setResult(null);
    setError(null);
  }, []);
  
  const getErrorMessage = (errorCode: FaceComparisonResult['error']) => {
    switch(errorCode) {
      case 'NO_FACE_1': return "No face detected in Image 1.";
      case 'NO_FACE_2': return "No face detected in Image 2.";
      case 'MULTIPLE_FACES_1': return "Multiple faces detected in Image 1. Please use an image with a single face.";
      case 'MULTIPLE_FACES_2': return "Multiple faces detected in Image 2. Please use an image with a single face.";
      default: return "An unknown error occurred during comparison.";
    }
  }

  const handleCompare = async () => {
    if (!image1 || !image2) {
      setError('Please provide two images to compare.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const comparisonResult = await compareFaces(image1, image2);
      setResult(comparisonResult);
      if(comparisonResult.error){
        setError(getErrorMessage(comparisonResult.error));
      }
    } catch (err) {
      setError('An unexpected error occurred. See console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImage1(null);
    setImage2(null);
    setPreview1(null);
    setPreview2(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };
  
  const isMatch = useMemo(() => {
    if (result?.similarity === null || result?.similarity === undefined) return null;
    return result.similarity >= threshold;
  }, [result, threshold]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageDropzone onImageDrop={(file) => handleImageDrop(file, 1)} imagePreviewUrl={preview1} id="image1-upload" />
        <ImageDropzone onImageDrop={(file) => handleImageDrop(file, 2)} imagePreviewUrl={preview2} id="image2-upload" />
      </div>
      
      <div className="bg-slate-800/50 p-4 rounded-lg flex flex-col items-center space-y-4">
        <div className="w-full max-w-md">
          <label htmlFor="threshold" className="block text-sm font-medium text-slate-300 mb-2">Similarity Threshold: {threshold}%</label>
          <input
            id="threshold"
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleCompare}
            disabled={!image1 || !image2 || isLoading || !modelsLoaded}
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Spinner size="sm"/> : 'Compare Faces'}
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}
        
        {result && result.similarity !== null && (
          <div className="mt-4 p-4 rounded-lg text-center w-full max-w-md transition-all duration-300"
               style={{
                 backgroundColor: isMatch ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                 border: `1px solid ${isMatch ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
               }}
          >
            <p className="text-lg font-medium">Similarity Score:</p>
            <p className="text-4xl font-bold my-2" style={{color: isMatch ? '#22c55e' : '#ef4444'}}>{result.similarity.toFixed(2)}%</p>
            <p className={`text-xl font-semibold ${isMatch ? 'text-green-400' : 'text-red-400'}`}>
              {isMatch ? 'Match Found' : 'No Match'}
            </p>
            <p className="text-sm text-slate-400">(Threshold: {threshold}%)</p>
            <p className="text-xs text-slate-500 mt-2">Processing time: {result.processingTime.toFixed(0)} ms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceComparisonTab;