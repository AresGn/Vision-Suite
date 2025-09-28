/**
 * Types pour les services améliorés (Scribe.js + YOLOv11n)
 */

// Types pour Scribe.js OCR
export interface ScribeConfig {
  language?: string[];
  tesseract?: {
    psm?: number;
    oem?: number;
  };
  addTextLayer?: boolean;
  outputFormat?: string;
}

export interface ScribeResult {
  text: string;
  confidence: number;
  words?: any[];
  processingTime: number;
}

export interface ExtractedIdentityData {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroCI?: string;
  nationalite?: string;
  sexe?: string;
  [key: string]: string | undefined;
}

export interface DocumentAnalysisResult {
  rawText: string;
  extractedData: ExtractedIdentityData;
  confidence: number;
  processingTime: number;
}

// Types pour YOLOv11n Face Detection
export interface FaceDetection {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  class: string;
}

export interface DetectionResult {
  detections: FaceDetection[];
  processingTime: number;
  imageWidth: number;
  imageHeight: number;
}

// Types pour l'analyse combinée
export interface ComprehensiveAnalysisResult {
  // OCR Results
  ocrResult: DocumentAnalysisResult;
  
  // Face Detection Results
  faceDetections: FaceDetection[];
  faceDetectionTime: number;
  
  // Combined Analysis
  hasValidFace: boolean;
  faceCount: number;
  overallConfidence: number;
  processingTime: number;
  
  // Quality Assessment
  documentQuality: DocumentQuality;
  recommendations: string[];
}

export interface DocumentQuality {
  textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  faceQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

export interface AnalysisOptions {
  enableFaceDetection?: boolean;
  enableOCR?: boolean;
  faceConfidenceThreshold?: number;
  yoloModelPath?: string;
  preprocessImage?: boolean;
}

// Types pour les comparaisons de performance
export interface PerformanceComparison {
  currentImplementation: {
    processingTime: number;
    confidence: number;
    extractedFields: number;
    faceDetected: boolean;
  };
  enhancedImplementation: {
    processingTime: number;
    confidence: number;
    extractedFields: number;
    faceDetected: boolean;
    faceCount: number;
    documentQuality: DocumentQuality['overallQuality'];
  };
  improvement: {
    speedImprovement: number; // pourcentage
    accuracyImprovement: number; // pourcentage
    additionalFeatures: string[];
  };
}

// Types pour l'interface utilisateur
export interface EnhancedOcrTabState {
  // États existants
  image: File | null;
  isProcessing: boolean;
  error: string | null;
  
  // Nouveaux états pour les services améliorés
  useEnhancedServices: boolean;
  comprehensiveResult: ComprehensiveAnalysisResult | null;
  performanceComparison: PerformanceComparison | null;
  
  // Options d'analyse
  analysisOptions: AnalysisOptions;
}

// Types pour les résultats d'affichage
export interface DisplayableResult {
  type: 'basic' | 'enhanced' | 'comparison';
  title: string;
  confidence: number;
  processingTime: number;
  extractedData: Record<string, any>;
  additionalInfo?: {
    faceDetections?: FaceDetection[];
    documentQuality?: DocumentQuality;
    recommendations?: string[];
  };
}

// Types pour les métriques de performance
export interface PerformanceMetrics {
  ocrTime: number;
  faceDetectionTime: number;
  totalTime: number;
  memoryUsage?: number;
  accuracy: {
    ocr: number;
    faceDetection: number;
    overall: number;
  };
}

// Types pour la configuration des modèles
export interface ModelConfiguration {
  yolo: {
    modelPath: string;
    confidenceThreshold: number;
    inputSize: number;
    backend: 'webgl' | 'cpu';
  };
  scribe: {
    languages: string[];
    tesseractConfig: {
      psm: number;
      oem: number;
    };
  };
}

// Types pour les événements de progression
export interface ProgressEvent {
  stage: 'initialization' | 'ocr' | 'face_detection' | 'analysis' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: any;
}

// Types pour la gestion des erreurs
export interface EnhancedError {
  code: string;
  message: string;
  service: 'scribe' | 'yolo' | 'analyzer' | 'general';
  details?: any;
  suggestions?: string[];
}

// Types pour les tests et validation
export interface TestCase {
  id: string;
  name: string;
  description: string;
  imageFile: File;
  expectedResults: {
    extractedFields: string[];
    faceCount: number;
    minimumConfidence: number;
  };
}

export interface TestResult {
  testCase: TestCase;
  actualResults: ComprehensiveAnalysisResult;
  passed: boolean;
  issues: string[];
  score: number; // 0-100
}

// Types pour l'export des résultats
export interface ExportableResult {
  timestamp: string;
  imageInfo: {
    name: string;
    size: number;
    type: string;
  };
  analysisResults: ComprehensiveAnalysisResult;
  performanceMetrics: PerformanceMetrics;
  configuration: ModelConfiguration;
}

// Types pour les statistiques d'utilisation
export interface UsageStatistics {
  totalAnalyses: number;
  successRate: number;
  averageProcessingTime: number;
  mostCommonIssues: string[];
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

// Déclarations globales pour les bibliothèques externes
declare global {
  interface Window {
    scribe?: {
      extractText: (sources: string[], config?: ScribeConfig) => Promise<string>;
      processDocument: (input: any, config?: ScribeConfig) => Promise<any>;
    };
    tf?: {
      loadGraphModel: (modelUrl: string) => Promise<any>;
      browser: {
        fromPixels: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => any;
      };
      zeros: (shape: number[]) => any;
      dispose: (tensor: any) => void;
      ready: () => Promise<void>;
      setBackend: (backend: string) => Promise<boolean>;
    };
  }
}
