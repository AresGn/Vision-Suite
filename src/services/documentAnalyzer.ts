/**
 * Document Analyzer Service
 * Combines Scribe.js OCR and YOLOv11n face detection for comprehensive document analysis
 */

import { YOLOFaceDetector, type FaceDetection, type DetectionResult } from './yoloFaceDetector';
import {
  analyzeIdentityDocument,
  extractTextWithScribe,
  type DocumentAnalysisResult,
  type ExtractedIdentityData
} from './ocrScribeService';
import { performanceOptimizer, type PerformanceMetrics } from './performanceOptimizer';

interface ComprehensiveAnalysisResult {
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

  // Performance Metrics
  performanceMetrics: PerformanceMetrics;
}

interface DocumentQuality {
  textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  faceQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

interface AnalysisOptions {
  enableFaceDetection?: boolean;
  enableOCR?: boolean;
  faceConfidenceThreshold?: number;
  yoloModelPath?: string;
  preprocessImage?: boolean;
}

/**
 * Classe principale pour l'analyse complète de documents
 */
export class DocumentAnalyzer {
  private yoloDetector: YOLOFaceDetector;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(yoloModelPath?: string) {
    this.yoloDetector = new YOLOFaceDetector(yoloModelPath);
  }

  /**
   * Initialise l'analyseur de documents
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initialisation de l\'analyseur de documents...');

      // Initialiser l'optimiseur de performance
      await performanceOptimizer.checkWebGLSupport();

      // Charger le modèle YOLO
      await this.yoloDetector.loadModel();

      // Précharger les modèles si configuré
      if (this.yoloDetector.isLoaded()) {
        console.log('✓ Modèles préchargés pour de meilleures performances');
      }

      this.isInitialized = true;
      console.log('Analyseur de documents initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Analyse complète d'un document d'identité
   */
  async analyzeDocument(
    imageFile: File, 
    options: AnalysisOptions = {}
  ): Promise<ComprehensiveAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Analyseur non initialisé. Appelez initialize() d\'abord.');
    }

    const {
      enableFaceDetection = true,
      enableOCR = true,
      faceConfidenceThreshold = 0.5,
      preprocessImage = true
    } = options;

    const startTime = performance.now();

    try {
      // Créer un élément image pour l'analyse
      const img = await this.fileToImageElement(imageFile);
      
      // Exécuter OCR et détection de visages en parallèle
      const [ocrResult, faceResult] = await Promise.all([
        enableOCR ? analyzeIdentityDocument(imageFile) : this.createEmptyOCRResult(),
        enableFaceDetection ? this.detectFacesInImage(img, faceConfidenceThreshold) : this.createEmptyFaceResult()
      ]);

      // Calculer la confiance globale
      const overallConfidence = this.calculateOverallConfidence(ocrResult, faceResult);
      
      // Évaluer la qualité du document
      const documentQuality = this.assessDocumentQuality(ocrResult, faceResult);
      
      // Générer des recommandations
      const recommendations = this.generateRecommendations(ocrResult, faceResult, documentQuality);

      const endTime = performance.now();

      return {
        ocrResult,
        faceDetections: faceResult.detections,
        faceDetectionTime: faceResult.processingTime,
        hasValidFace: faceResult.detections.length > 0,
        faceCount: faceResult.detections.length,
        overallConfidence,
        processingTime: endTime - startTime,
        documentQuality,
        recommendations
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du document:', error);
      throw new Error(`Échec de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Détecte les visages dans une image
   */
  private async detectFacesInImage(img: HTMLImageElement, confidenceThreshold: number): Promise<DetectionResult> {
    this.yoloDetector.setConfidenceThreshold(confidenceThreshold);
    return await this.yoloDetector.detectFaces(img);
  }

  /**
   * Convertit un fichier en élément image
   */
  private fileToImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
        } else {
          reject(new Error('Erreur de lecture du fichier'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur FileReader'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calcule la confiance globale basée sur OCR et détection de visages
   */
  private calculateOverallConfidence(
    ocrResult: DocumentAnalysisResult, 
    faceResult: DetectionResult
  ): number {
    const ocrConfidence = ocrResult.confidence;
    const faceConfidence = faceResult.detections.length > 0 
      ? faceResult.detections.reduce((acc, det) => acc + det.confidence, 0) / faceResult.detections.length 
      : 0;
    
    // Pondération: 60% OCR, 40% détection de visages
    return (ocrConfidence * 0.6) + (faceConfidence * 0.4);
  }

  /**
   * Évalue la qualité du document
   */
  private assessDocumentQuality(
    ocrResult: DocumentAnalysisResult, 
    faceResult: DetectionResult
  ): DocumentQuality {
    const issues: string[] = [];
    
    // Évaluation de la qualité du texte
    let textQuality: DocumentQuality['textQuality'];
    const extractedFieldsCount = Object.keys(ocrResult.extractedData).length;
    
    if (ocrResult.confidence > 0.8 && extractedFieldsCount >= 4) {
      textQuality = 'excellent';
    } else if (ocrResult.confidence > 0.6 && extractedFieldsCount >= 3) {
      textQuality = 'good';
    } else if (ocrResult.confidence > 0.4 && extractedFieldsCount >= 2) {
      textQuality = 'fair';
      issues.push('Qualité OCR moyenne - vérifiez l\'éclairage et la netteté');
    } else {
      textQuality = 'poor';
      issues.push('Qualité OCR faible - document illisible ou de mauvaise qualité');
    }

    // Évaluation de la qualité des visages
    let faceQuality: DocumentQuality['faceQuality'];
    
    if (faceResult.detections.length === 0) {
      faceQuality = 'none';
      issues.push('Aucun visage détecté dans le document');
    } else if (faceResult.detections.length > 1) {
      faceQuality = 'fair';
      issues.push('Plusieurs visages détectés - vérifiez que le document ne contient qu\'une seule personne');
    } else {
      const faceConfidence = faceResult.detections[0].confidence;
      if (faceConfidence > 0.8) {
        faceQuality = 'excellent';
      } else if (faceConfidence > 0.6) {
        faceQuality = 'good';
      } else if (faceConfidence > 0.4) {
        faceQuality = 'fair';
        issues.push('Qualité de détection de visage moyenne');
      } else {
        faceQuality = 'poor';
        issues.push('Qualité de détection de visage faible');
      }
    }

    // Évaluation globale
    let overallQuality: DocumentQuality['overallQuality'];
    if (textQuality === 'excellent' && (faceQuality === 'excellent' || faceQuality === 'good')) {
      overallQuality = 'excellent';
    } else if (textQuality === 'good' && faceQuality !== 'poor' && faceQuality !== 'none') {
      overallQuality = 'good';
    } else if (textQuality !== 'poor' || faceQuality !== 'none') {
      overallQuality = 'fair';
    } else {
      overallQuality = 'poor';
    }

    return {
      textQuality,
      faceQuality,
      overallQuality,
      issues
    };
  }

  /**
   * Génère des recommandations d'amélioration
   */
  private generateRecommendations(
    ocrResult: DocumentAnalysisResult,
    faceResult: DetectionResult,
    quality: DocumentQuality
  ): string[] {
    const recommendations: string[] = [];

    if (quality.overallQuality === 'excellent') {
      recommendations.push('Document de qualité excellente - analyse complète réussie');
      return recommendations;
    }

    if (quality.textQuality === 'poor') {
      recommendations.push('Améliorez l\'éclairage et assurez-vous que le document est bien net');
      recommendations.push('Vérifiez que le document n\'est pas plié ou endommagé');
    }

    if (quality.faceQuality === 'none') {
      recommendations.push('Assurez-vous que la photo d\'identité est visible dans le document');
      recommendations.push('Vérifiez que le document est correctement orienté');
    }

    if (faceResult.detections.length > 1) {
      recommendations.push('Masquez les autres personnes visibles dans l\'image');
    }

    if (Object.keys(ocrResult.extractedData).length < 3) {
      recommendations.push('Vérifiez que tous les champs du document sont lisibles');
      recommendations.push('Essayez de prendre une photo avec une meilleure résolution');
    }

    return recommendations;
  }

  /**
   * Crée un résultat OCR vide
   */
  private createEmptyOCRResult(): DocumentAnalysisResult {
    return {
      rawText: '',
      extractedData: {},
      confidence: 0,
      processingTime: 0
    };
  }

  /**
   * Crée un résultat de détection de visages vide
   */
  private createEmptyFaceResult(): DetectionResult {
    return {
      detections: [],
      processingTime: 0,
      imageWidth: 0,
      imageHeight: 0
    };
  }

  /**
   * Libère les ressources
   */
  dispose(): void {
    this.yoloDetector.dispose();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Vérifie si l'analyseur est initialisé
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export des types
export type {
  ComprehensiveAnalysisResult,
  DocumentQuality,
  AnalysisOptions
};
