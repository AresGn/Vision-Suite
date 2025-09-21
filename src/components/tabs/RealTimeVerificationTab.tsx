
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { DocumentType, PhotoExtractionResult, VerificationResult } from '../../types/verification.types';
import { extractPhotoFromDocument, verifyFaceAgainstStream } from '../../services/verificationService';
import ImageDropzone from '../ui/ImageDropzone';
import Spinner from '../ui/Spinner';

type Phase = 'DOCUMENT_UPLOAD' | 'PHOTO_EXTRACTION' | 'LIVE_VERIFICATION' | 'RESULT';

const RealTimeVerificationTab: React.FC<{ modelsLoaded: boolean }> = ({ modelsLoaded }) => {
  const [phase, setPhase] = useState<Phase>('DOCUMENT_UPLOAD');
  const [documentType, setDocumentType] = useState<DocumentType>('CNI');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  
  const [extractedData, setExtractedData] = useState<PhotoExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const resetState = () => {
    stopWebcam();
    setPhase('DOCUMENT_UPLOAD');
    setDocumentFile(null);
    setDocumentPreview(null);
    setExtractedData(null);
    setVerificationResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleDocumentDrop = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setDocumentFile(file);
    setDocumentPreview(URL.createObjectURL(file));
    setIsLoading(true);
    setPhase('PHOTO_EXTRACTION');

    try {
      const result = await extractPhotoFromDocument(file, documentType);
      setExtractedData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to extract photo.');
      setPhase('DOCUMENT_UPLOAD');
    } finally {
      setIsLoading(false);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamOn(true);
    } catch (err) {
      setError("Could not access webcam. Please check permissions.");
    }
  };

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsWebcamOn(false);
  }, []);

  const processFrame = async () => {
    if (!videoRef.current || !extractedData?.faceDescriptor) return;

    try {
      const result = await verifyFaceAgainstStream(videoRef.current, extractedData.faceDescriptor);
      setVerificationResult(result);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video && result.bestMatch?.detection) {
        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetection = faceapi.resizeResults(result.bestMatch.detection, displaySize);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const boxColor = result.status === 'VERIFIED' ? '#22c55e' : '#ef4444';
          new faceapi.draw.DrawBox(resizedDetection.detection.box, { label: `Match: ${(result.similarity * 100).toFixed(1)}%`, boxColor }).draw(canvas);
        }
      } else if (canvas) {
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (error) {
      console.error("Frame processing error:", error);
    }
  };

  useEffect(() => {
    if (isWebcamOn && extractedData) {
      intervalRef.current = window.setInterval(processFrame, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if(intervalRef.current) clearInterval(intervalRef.current) };
  }, [isWebcamOn, extractedData]);

  useEffect(() => {
    return () => stopWebcam();
  }, [stopWebcam]);

  const renderDocumentUpload = () => (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <h2 className="text-2xl font-bold text-sky-400">Step 1: Upload Your Identity Document</h2>
      <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-slate-300 mb-2">Select Document Type</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="w-full bg-slate-700 border-slate-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="CNI">Benin - CNI</option>
            <option value="PASSPORT">Benin - Passport</option>
            <option value="CIP">Benin - CIP</option>
          </select>
        </div>
        <ImageDropzone onImageDrop={handleDocumentDrop} imagePreviewUrl={documentPreview} id="doc-upload" />
        {error && <p className="text-red-400 mt-4 bg-red-900/50 p-2 rounded-md">{error}</p>}
      </div>
    </div>
  );

  const renderPhotoExtraction = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <h2 className="text-2xl font-bold text-sky-400">Step 2: Photo Extraction</h2>
      <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner size="lg" />
            <p className="mt-4 text-sky-400">Analyzing document and extracting face...</p>
          </div>
        ) : (
          extractedData && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-green-400 font-semibold">✅ Photo Extracted Successfully!</p>
              <canvas
                ref={canvas => canvas && canvas.getContext('2d')?.drawImage(extractedData.extractedPhotoCanvas, 0, 0, canvas.width, canvas.height)}
                width="150"
                height="200"
                className="rounded-lg border-2 border-sky-500"
              />
               <div className="flex space-x-4">
                 <button onClick={() => {setPhase('LIVE_VERIFICATION'); startWebcam()}} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700">
                    Proceed to Live Verification
                 </button>
                 <button onClick={resetState} className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">
                    Start Over
                 </button>
               </div>
            </div>
          )
        )}
      </div>
    </div>
  );

  const renderLiveVerification = () => {
    const similarity = verificationResult?.similarity || 0;
    const meterColor = similarity > 0.55 ? 'bg-green-500' : similarity > 0.4 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-sky-400 text-center">Step 3: Real-Time Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-700">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                    {!isWebcamOn && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Spinner size="lg" /></div>}
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg flex flex-col items-center justify-center space-y-4">
                    <h3 className="font-semibold">Reference Photo</h3>
                    <canvas ref={canvas => canvas && extractedData && canvas.getContext('2d')?.drawImage(extractedData.extractedPhotoCanvas, 0, 0, canvas.width, canvas.height)}
                        width="120" height="160" className="rounded-md border-2 border-slate-500"/>
                    
                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium">Similarity</label>
                        <div className="w-full bg-slate-700 rounded-full h-4">
                            <div className={`${meterColor} h-4 rounded-full transition-all duration-300`} style={{width: `${Math.min(similarity * 100, 100)}%`}}></div>
                        </div>
                        <p className="text-center text-lg font-bold">{(similarity * 100).toFixed(1)}%</p>
                    </div>

                    <div className={`p-2 rounded-md w-full text-center font-bold ${verificationResult?.status === 'VERIFIED' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'}`}>
                        {verificationResult?.status === 'VERIFIED' ? 'MATCH DETECTED' : 'NO MATCH'}
                    </div>

                    <button onClick={resetState} className="w-full px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">
                        End Verification
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div>
      {phase === 'DOCUMENT_UPLOAD' && renderDocumentUpload()}
      {phase === 'PHOTO_EXTRACTION' && renderPhotoExtraction()}
      {phase === 'LIVE_VERIFICATION' && renderLiveVerification()}
    </div>
  );
};

export default RealTimeVerificationTab;