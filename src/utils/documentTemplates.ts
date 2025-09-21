
import type { DocumentTemplate, DocumentType } from '../types/verification.types';

export const BENIN_DOCUMENTS: Record<DocumentType, DocumentTemplate> = {
  CNI: {
    type: 'CNI',
    photoRegion: { x: 0.04, y: 0.25, width: 0.3, height: 0.45 },
    fallbackRegions: [
      { x: 0.02, y: 0.20, width: 0.35, height: 0.50 },
    ],
    validationRules: [
      { type: 'aspectRatio', min: 0.7, max: 1.3 },
      { type: 'faceDetection', required: true },
      { type: 'minResolution', width: 80, height: 100 }
    ],
  },
  
  PASSPORT: {
    type: 'PASSPORT',
    photoRegion: { x: 0.08, y: 0.28, width: 0.25, height: 0.4 },
    fallbackRegions: [
      { x: 0.05, y: 0.25, width: 0.3, height: 0.45 }
    ],
    validationRules: [
      { type: 'aspectRatio', min: 0.75, max: 0.9 },
      { type: 'faceDetection', required: true },
    ],
  },
  
  CIP: {
    type: 'CIP',
    photoRegion: { x: 0.05, y: 0.22, width: 0.32, height: 0.42 },
    fallbackRegions: [
      { x: 0.03, y: 0.18, width: 0.38, height: 0.50 }
    ],
    validationRules: [
      { type: 'aspectRatio', min: 0.7, max: 1.3 },
      { type: 'faceDetection', required: true }
    ],
  }
};