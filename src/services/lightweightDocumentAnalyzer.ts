/**
 * Analyseur de documents léger
 * Utilise Tesseract.js (déjà disponible) + face-api.js pour éviter les dépendances lourdes
 */

import { LightweightFaceDetector, type FaceDetection, type DetectionResult } from './lightweightFaceDetector';
import { recognizeText } from './ocrService';
import type { TesseractResult, OcrLanguage } from '../types/ocr.types';

interface ExtractedIdentityData {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroCI?: string;
  nationalite?: string;
  sexe?: string;
  [key: string]: string | undefined;
}

interface DocumentAnalysisResult {
  rawText: string;
  extractedData: ExtractedIdentityData;
  confidence: number;
  processingTime: number;
}

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
  ocrLanguage?: OcrLanguage;
}

/**
 * Patterns regex pour extraire les informations des cartes d'identité
 */
const IDENTITY_PATTERNS = {
  nom: /(?:NOM|SURNAME|FAMILY NAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s-]+)/i,
  prenom: /(?:PRÉNOM|PRENOM|GIVEN NAME|FIRST NAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝa-z\s-]+)/i,
  dateNaissance: /(?:NÉ|NE LE|BORN|DATE DE NAISSANCE)[:\s]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
  lieuNaissance: /(?:À|A|BORN IN|LIEU DE NAISSANCE)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s-]+)/i,
  numeroCI: /(?:CARTE N°|ID NO|N°|NO)[:\s]*(\d{8,12})/i,
  nationalite: /(?:NATIONALITÉ|NATIONALITY)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s-]+)/i,
  sexe: /(?:SEXE|SEX|GENRE)[:\s]*([MF]|MALE|FEMALE|MASCULIN|FÉMININ)/i
};

/**
 * Analyseur de documents léger
 */
export class LightweightDocumentAnalyzer {
  private faceDetector: LightweightFaceDetector;
  private isInitialized = false;

  constructor() {
    this.faceDetector = new LightweightFaceDetector();
  }

  /**
   * Initialise l'analyseur
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initialisation de l\'analyseur léger...');
      
      // Initialiser le détecteur de visages
      await this.faceDetector.initialize();
      
      this.isInitialized = true;
      console.log('✓ Analyseur léger initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Analyse complète d'un document
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
      ocrLanguage = 'fra'
    } = options;

    const startTime = performance.now();

    try {
      // Créer un élément image pour l'analyse
      const img = await this.fileToImageElement(imageFile);
      
      // Exécuter OCR et détection de visages en parallèle
      const [ocrResult, faceResult] = await Promise.all([
        enableOCR ? this.performOCR(imageFile, ocrLanguage) : this.createEmptyOCRResult(),
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
   * Effectue l'OCR avec Tesseract.js
   */
  private async performOCR(file: File, language: OcrLanguage): Promise<DocumentAnalysisResult> {
    const startTime = performance.now();
    
    try {
      // Utiliser le service OCR existant
      const tesseractResult = await recognizeText(file, language, () => {});
      
      // Parser les données d'identité
      const extractedData = this.parseIdentityData(tesseractResult.rawText);
      
      const endTime = performance.now();
      
      return {
        rawText: tesseractResult.rawText,
        extractedData,
        confidence: tesseractResult.confidence / 100, // Normaliser à 0-1
        processingTime: endTime - startTime
      };
    } catch (error) {
      console.error('Erreur OCR:', error);
      return this.createEmptyOCRResult();
    }
  }

  /**
   * Parse les données d'identité depuis le texte OCR
   */
  private parseIdentityData(ocrText: string): ExtractedIdentityData {
    const extractedInfo: ExtractedIdentityData = {};
    
    Object.entries(IDENTITY_PATTERNS).forEach(([key, pattern]) => {
      const match = ocrText.match(pattern);
      if (match && match[1]) {
        extractedInfo[key] = match[1].trim();
      }
    });
    
    return extractedInfo;
  }

  /**
   * Détecte les visages dans une image
   */
  private async detectFacesInImage(img: HTMLImageElement, confidenceThreshold: number): Promise<DetectionResult> {
    this.faceDetector.setConfidenceThreshold(confidenceThreshold);
    return await this.faceDetector.detectFaces(img);
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
   * Calcule la confiance globale
   */
  private calculateOverallConfidence(
    ocrResult: DocumentAnalysisResult, 
    faceResult: DetectionResult
  ): number {
    const ocrConfidence = ocrResult.confidence;
    const faceConfidence = faceResult.detections.length > 0 
      ? faceResult.detections.reduce((acc, det) => acc + det.confidence, 0) / faceResult.detections.length 
      : 0;
    
    // Pondération: 70% OCR, 30% détection de visages
    return (ocrConfidence * 0.7) + (faceConfidence * 0.3);
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
      issues.push('Plusieurs visages détectés');
    } else {
      const faceConfidence = faceResult.detections[0].confidence;
      if (faceConfidence > 0.8) {
        faceQuality = 'excellent';
      } else if (faceConfidence > 0.6) {
        faceQuality = 'good';
      } else {
        faceQuality = 'fair';
        issues.push('Qualité de détection de visage moyenne');
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
   * Génère des recommandations
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
      recommendations.push('Améliorez l\'éclairage et la netteté du document');
    }

    if (quality.faceQuality === 'none') {
      recommendations.push('Assurez-vous que la photo d\'identité est visible');
    }

    if (faceResult.detections.length > 1) {
      recommendations.push('Masquez les autres personnes dans l\'image');
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
   * Vérifie si l'analyseur est prêt
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Libère les ressources
   */
  dispose(): void {
    this.faceDetector.dispose();
    this.isInitialized = false;
  }
}

// Export des types
export type {
  ComprehensiveAnalysisResult,
  DocumentQuality,
  AnalysisOptions,
  ExtractedIdentityData,
  DocumentAnalysisResult
};
