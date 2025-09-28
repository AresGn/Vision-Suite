/**
 * Scribe.js OCR Service
 * Advanced OCR service using Scribe.js for better document analysis
 */

// Types for Scribe.js
interface ScribeConfig {
  language?: string[];
  tesseract?: {
    psm?: number;
    oem?: number;
  };
  addTextLayer?: boolean;
  outputFormat?: string;
}

interface ScribeResult {
  text: string;
  confidence: number;
  words?: any[];
  processingTime: number;
}

interface ExtractedIdentityData {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroCI?: string;
  [key: string]: string | undefined;
}

interface DocumentAnalysisResult {
  rawText: string;
  extractedData: ExtractedIdentityData;
  confidence: number;
  processingTime: number;
}

// Global scribe declaration (will be loaded from CDN or npm)
declare global {
  var scribe: {
    extractText: (sources: string[], config?: ScribeConfig) => Promise<string>;
    processDocument: (input: any, config?: ScribeConfig) => Promise<any>;
  };
}

/**
 * Configuration optimisée pour les documents d'identité français
 */
const IDENTITY_CARD_CONFIG: ScribeConfig = {
  language: ['fra', 'eng'], // Support français et anglais
  tesseract: {
    psm: 6, // Mode de segmentation uniforme
    oem: 1  // Moteur LSTM uniquement
  }
};

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
 * Vérifie si Scribe.js est disponible
 */
function isScribeAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.scribe !== 'undefined';
}

/**
 * Charge Scribe.js depuis le CDN si nécessaire
 */
async function loadScribeIfNeeded(): Promise<void> {
  if (isScribeAvailable()) return;

  // Si nous sommes dans un environnement Node.js, essayer d'importer le module
  if (typeof window === 'undefined') {
    try {
      const scribeModule = await import('scribe.js-ocr');
      (global as any).scribe = scribeModule.default || scribeModule;
    } catch (error) {
      throw new Error('Scribe.js not available. Please install scribe.js-ocr package.');
    }
  } else {
    // Dans le navigateur, charger depuis le CDN
    throw new Error('Scribe.js not loaded. Please include scribe.js in your HTML.');
  }
}

/**
 * Convertit un fichier en URL d'objet pour Scribe.js
 */
function fileToObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Parse les données d'identité depuis le texte OCR
 */
function parseIdentityData(ocrText: string): ExtractedIdentityData {
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
 * Nettoie et améliore le texte extrait
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .replace(/[^\w\s\-\.\/]/g, ' ') // Supprimer les caractères spéciaux sauf tirets, points et slashes
    .trim();
}

/**
 * Extrait le texte d'un document avec Scribe.js
 */
export async function extractTextWithScribe(
  file: File,
  config: ScribeConfig = IDENTITY_CARD_CONFIG
): Promise<ScribeResult> {
  await loadScribeIfNeeded();
  
  const startTime = performance.now();
  const imageUrl = fileToObjectURL(file);
  
  try {
    const rawText = await scribe.extractText([imageUrl], config);
    const cleanedText = cleanExtractedText(rawText);
    const endTime = performance.now();
    
    // Calculer une confiance basée sur la longueur et la qualité du texte
    const confidence = Math.min(0.95, Math.max(0.1, cleanedText.length / 100));
    
    return {
      text: cleanedText,
      confidence,
      processingTime: endTime - startTime
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Analyse complète d'un document d'identité
 */
export async function analyzeIdentityDocument(file: File): Promise<DocumentAnalysisResult> {
  const startTime = performance.now();
  
  try {
    // Extraction OCR avec Scribe.js
    const ocrResult = await extractTextWithScribe(file);
    
    // Parsing des données structurées
    const extractedData = parseIdentityData(ocrResult.text);
    
    // Calcul de la confiance globale
    const dataFieldsCount = Object.keys(extractedData).length;
    const dataConfidence = Math.min(0.95, dataFieldsCount * 0.15);
    const overallConfidence = (ocrResult.confidence + dataConfidence) / 2;
    
    const endTime = performance.now();
    
    return {
      rawText: ocrResult.text,
      extractedData,
      confidence: overallConfidence,
      processingTime: endTime - startTime
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du document:', error);
    throw new Error(`Échec de l'analyse du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Crée un PDF recherchable avec couche texte invisible
 */
export async function createSearchablePdf(file: File): Promise<Blob> {
  await loadScribeIfNeeded();
  
  const imageUrl = fileToObjectURL(file);
  
  try {
    const result = await scribe.processDocument(imageUrl, {
      addTextLayer: true,
      outputFormat: 'pdf'
    });
    
    return result;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Préprocessing d'image pour améliorer les performances OCR
 */
export function preprocessImageForOCR(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Échec de la lecture du fichier image.'));
      }
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Impossible d\'obtenir le contexte canvas'));
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Amélioration du contraste et de la luminosité
          ctx.filter = 'contrast(1.2) brightness(1.1)';
          ctx.drawImage(img, 0, 0);
          
          resolve(canvas);
        } catch (error) {
          reject(new Error('Échec du préprocessing de l\'image: ' + error));
        }
      };
      img.onerror = () => reject(new Error('Échec du chargement de l\'image pour le préprocessing.'));
      img.src = event.target.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur FileReader.'));
    reader.readAsDataURL(file);
  });
}

// Export des types pour utilisation dans d'autres modules
export type {
  ScribeConfig,
  ScribeResult,
  ExtractedIdentityData,
  DocumentAnalysisResult
};
