// This allows using the face-api.js script loaded from CDN with TypeScript
// FIX: Wrap in declare global to make faceapi available in all modules.
declare global {
  // FIX: Changed const to var to allow redeclaration across potentially duplicated type files.
  var faceapi: any;
}

export interface AgeEstimationResult {
  id: number;
  imageName: string;
  estimatedAge: number; // For history, this could be an average
  faceCount: number;
  detections?: FaceDetection[]; // Detailed detections for current analysis
  avgConfidence: number;
  timestamp: string;
  imagePreview: string; // Base64 of image with annotations
}

export interface FaceDetection {
  age: number;
  gender: 'male' | 'female';
  genderProbability: number;
  expressions: Record<string, number>;
  dominantEmotion: string;
  box: { x: number; y: number; width: number; height: number };
  detectionConfidence: number;
}

export interface FaceComparisonResult {
  similarity: number | null;
  processingTime: number;
  error?: 'NO_FACE_1' | 'NO_FACE_2' | 'MULTIPLE_FACES_1' | 'MULTIPLE_FACES_2' | 'UNKNOWN';
}