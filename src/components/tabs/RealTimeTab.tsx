import React, { useState, useRef, useEffect, useCallback } from 'react';
import Spinner from '../ui/Spinner';

interface RealTimeTabProps {
  modelsLoaded: boolean;
}

const RealTimeTab: React.FC<RealTimeTabProps> = ({ modelsLoaded }) => {
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [options, setOptions] = useState({
    faceDetection: true,
    ageEstimation: true,
    emotions: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [webcamStatus, setWebcamStatus] = useState<'OFF' | 'STARTING' | 'ON' | 'ERROR'>('OFF');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({ ...options, [e.target.name]: e.target.checked });
  };
  
  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
    
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    const ctx = canvas.getContext('2d');
    if(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (options.faceDetection) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
        }
        if ((options.ageEstimation || options.emotions) && resizedDetections) {
            resizedDetections.forEach((detection: any) => {
                const box = detection.detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {
                    boxColor: '#0ea5e9',
                    label: buildLabel(detection),
                });
                drawBox.draw(canvas);
            });
        }
    }
  };

  const buildLabel = (detection: any) => {
    const age = options.ageEstimation ? `${Math.round(detection.age)} yrs` : '';
    let emotion = '';
    if(options.emotions && detection.expressions){
        const dominantEmotion = Object.entries(detection.expressions).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        emotion = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
    }
    return [age, emotion].filter(Boolean).join(' | ');
  }

  const startWebcam = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setWebcamStatus('STARTING');
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsWebcamOn(true);
        setWebcamStatus('ON');
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access webcam. Please check permissions.");
        setWebcamStatus('ERROR');
      }
    } else {
      setError("Webcam not supported by this browser.");
      setWebcamStatus('ERROR');
    }
  };

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    if(videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setIsWebcamOn(false);
    setWebcamStatus('OFF');
  }, []);

  useEffect(() => {
    if (isWebcamOn && modelsLoaded) {
        // Throttling to keep performance stable
        intervalRef.current = window.setInterval(processFrame, 200); // Process every 200ms
    } else {
        if(intervalRef.current) window.clearInterval(intervalRef.current);
    }
    return () => {
        if(intervalRef.current) window.clearInterval(intervalRef.current);
    }
  }, [isWebcamOn, modelsLoaded, options]);
  
  const captureScreenshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.clientWidth;
        tempCanvas.height = video.clientHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            const link = document.createElement('a');
            link.download = `screenshot_${new Date().toISOString()}.png`;
            link.href = tempCanvas.toDataURL();
            link.click();
        }
    }
  };

  useEffect(() => {
    return () => { // Cleanup on unmount
      stopWebcam();
    };
  }, [stopWebcam]);

  const StatusIndicator = () => {
    const colorMap = {
        OFF: 'bg-slate-500',
        STARTING: 'bg-yellow-500 animate-pulse',
        ON: 'bg-green-500',
        ERROR: 'bg-red-500',
    };
    return <span className={`w-3 h-3 rounded-full mr-2 ${colorMap[webcamStatus]}`}></span>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-700">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
          {webcamStatus === 'STARTING' && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Spinner size="lg" /></div>}
          {!isWebcamOn && webcamStatus !== 'STARTING' && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-slate-400">Webcam is off</div>}
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg space-y-6">
        <div>
            <div className="flex items-center mb-4">
                <StatusIndicator />
                <h3 className="text-lg font-semibold">Controls</h3>
            </div>
            <div className="flex space-x-2">
                <button onClick={startWebcam} disabled={isWebcamOn || !modelsLoaded} className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">Start</button>
                <button onClick={stopWebcam} disabled={!isWebcamOn} className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">Stop</button>
            </div>
             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-3">Analysis Options</h3>
            <div className="space-y-2">
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="faceDetection" checked={options.faceDetection} onChange={handleOptionChange} className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"/>
                    <span className="text-slate-300">Face Detection</span>
                </label>
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="ageEstimation" checked={options.ageEstimation} onChange={handleOptionChange} className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"/>
                    <span className="text-slate-300">Age Estimation</span>
                </label>
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="emotions" checked={options.emotions} onChange={handleOptionChange} className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"/>
                    <span className="text-slate-300">Emotion Detection</span>
                </label>
            </div>
        </div>

        <div>
            <button onClick={captureScreenshot} disabled={!isWebcamOn} className="w-full py-2 px-4 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                Capture Screenshot
            </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTab;