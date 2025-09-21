
export type DocumentType = 'CNI' | 'PASSPORT' | 'CIP';

export interface PhotoRegion {
  x: number; // Position X relative (%)
  y: number; // Position Y relative (%)
  width: number; // Largeur relative (%)
  height: number; // Hauteur relative (%)
}

export interface ValidationRule {
    type: 'aspectRatio' | 'faceDetection' | 'minResolution';
    min?: number;
    max?: number;
    required?: boolean;
    width?: number;
    height?: number;
}

export interface DocumentTemplate {
  type: DocumentType;
  photoRegion: PhotoRegion;
  fallbackRegions: PhotoRegion[];
  validationRules: ValidationRule[];
}

export interface PhotoExtractionResult {
    extractedPhotoCanvas: HTMLCanvasElement;
    faceDescriptor: Float32Array;
    confidence: number;
    documentType: DocumentType;
}

export interface FaceMatch {
    detection: any; // face-api detection object
    similarity: number;
    confidence: number;
}

export interface VerificationResult {
    status: 'VERIFIED' | 'NOT_VERIFIED' | 'PROCESSING' | 'NO_FACE' | 'ERROR';
    similarity: number;
    bestMatch?: FaceMatch;
    allFaces?: FaceMatch[];
}