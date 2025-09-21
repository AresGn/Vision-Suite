
import React, { useState, useCallback } from 'react';
import ImageDropzone from '../ui/ImageDropzone';
import { detectFacesAndDetails } from '../../services/analysisService';
import Spinner from '../ui/Spinner';
import type { AgeEstimationResult, FaceDetection } from '../../types';

interface AgeEstimationTabProps {
  modelsLoaded: boolean;
}

const AgeEstimationTab: React.FC<AgeEstimationTabProps> = ({ modelsLoaded }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AgeEstimationResult | null>(null);
  const [history, setHistory] = useState<AgeEstimationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageDrop = useCallback((file: File | null) => {
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      setImage(null);
      setPreview(null);
    }
  }, []);

  const drawDetections = async (imageFile: File, detections: FaceDetection[]): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(img.src);

        ctx.drawImage(img, 0, 0);

        detections.forEach(detection => {
          const { box, age, gender, dominantEmotion } = detection;
          ctx.strokeStyle = '#0ea5e9'; // sky-500
          ctx.lineWidth = Math.max(2, img.width / 400);
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          const label = `${Math.round(age)}y, ${gender}, ${dominantEmotion}`;
          const fontSize = Math.max(12, img.width / 80);
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = '#0ea5e9';
          const text = label;
          const textWidth = ctx.measureText(text).width;
          
          ctx.fillRect(box.x, box.y - (fontSize + 4), textWidth + 8, fontSize + 4);
          ctx.fillStyle = '#fff';
          ctx.fillText(text, box.x + 4, box.y - 4);
        });

        resolve(canvas.toDataURL());
      };
      img.onerror = () => resolve(img.src); // fallback to original if loading fails
    });
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please provide an image to analyze.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const detections = await detectFacesAndDetails(image);

      if (detections.length === 0) {
        setError("No faces detected in the image.");
        setIsLoading(false);
        return;
      }
      
      const annotatedImagePreview = await drawDetections(image, detections);
      
      const totalAge = detections.reduce((sum, d) => sum + d.age, 0);
      const avgAge = detections.length > 0 ? totalAge / detections.length : 0;
      const totalConfidence = detections.reduce((sum, d) => sum + d.detectionConfidence, 0);
      const avgConfidence = detections.length > 0 ? (totalConfidence / detections.length) * 100 : 0;

      const newResult: AgeEstimationResult = {
        id: Date.now(),
        imageName: image.name,
        estimatedAge: avgAge,
        faceCount: detections.length,
        detections,
        avgConfidence: avgConfidence,
        timestamp: new Date().toISOString(),
        imagePreview: annotatedImagePreview,
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 4)]); // Keep last 5 results

    } catch (err) {
      setError('An unexpected error occurred during analysis.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };
  
  const handleHistoryClick = (histResult: AgeEstimationResult) => {
    setResult(histResult);
    // don't set image/preview to avoid re-uploading
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <ImageDropzone onImageDrop={handleImageDrop} imagePreviewUrl={preview} id="age-image-upload" />
        <div className="bg-slate-800/50 p-4 rounded-lg flex justify-center space-x-4">
          <button
            onClick={handleAnalyze}
            disabled={!image || isLoading || !modelsLoaded}
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Spinner size="sm"/> : 'Analyze Image'}
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
        {error && <p className="text-red-400 text-center">{error}</p>}
        {history.length > 0 && (
          <div className="bg-slate-800/50 p-4 rounded-lg">
             <h3 className="text-lg font-semibold mb-2">Analysis History</h3>
             <div className="space-y-2">
               {history.map(hist => (
                 <button key={hist.id} onClick={() => handleHistoryClick(hist)} className="w-full text-left p-2 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors flex justify-between items-center">
                   <span>{hist.imageName} ({hist.faceCount} faces)</span>
                   <span className="text-xs text-slate-400">{new Date(hist.timestamp).toLocaleTimeString()}</span>
                 </button>
               ))}
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg min-h-[300px]">
        <h3 className="text-lg font-semibold mb-4">Analysis Result</h3>
        {result ? (
          <div className="space-y-4">
            <div>
              <img src={result.imagePreview} alt="Analysis result" className="rounded-lg w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-700/50 p-3 rounded-md">
                <p className="text-sm text-slate-400">Faces Detected</p>
                <p className="text-2xl font-bold text-sky-400">{result.faceCount}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-md">
                <p className="text-sm text-slate-400">Average Age</p>
                <p className="text-2xl font-bold text-sky-400">{result.estimatedAge.toFixed(1)}</p>
              </div>
            </div>
             <div className="space-y-2">
                 <h4 className="font-semibold">Detected Face Details:</h4>
                 {result.detections?.map((face, index) => (
                    <div key={index} className="bg-slate-700/50 p-2 rounded-md text-sm">
                        <p><strong>Face #{index + 1}:</strong> Age: {face.age.toFixed(0)}, Gender: {face.gender} ({ (face.genderProbability * 100).toFixed(1)}%), Emotion: {face.dominantEmotion}</p>
                    </div>
                 ))}
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Analysis results will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgeEstimationTab;