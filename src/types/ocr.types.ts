// Add Tesseract.js types for global usage from CDN
// This makes the Tesseract namespace available in all modules.
declare global {
  namespace Tesseract {
    export type Worker = any;
    // FIX: Changed const to var to allow redeclaration across potentially duplicated type files.
    export var PSM: any;
    export type Scheduler = any;
    export function createWorker(options?: any): Promise<Worker>;
    export function createScheduler(): Scheduler;
  }
}


/** Supported languages for OCR. This is a subset of what Tesseract supports. */
export type OcrLanguage = 'eng' | 'fra' | 'eng+fra';

/** Basic structured data extracted via regex post-processing. */
export interface ExtractedFields {
  emails: string[];
  phoneNumbers: string[];
  dates: string[];
}

/** The result object from the Tesseract.js OCR service. */
export interface TesseractResult {
  rawText: string;
  processedText: string;
  confidence: number;
  words: any[]; // Tesseract.js Word object array
  extractedFields: ExtractedFields;
  processingTime: number; // in milliseconds
  language: OcrLanguage;
}

/** The structured document result from Gemini AI analysis. */
export interface StructuredDocument {
  documentType: string;
  confidence: number;
  extractedFields: {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: string | null;
    birthPlace?: string | null;
    nationality?: string | null;
    documentNumber?: string | null;
    issueDate?: string | null;
    expiryDate?: string | null;
    issuingAuthority?: string | null;
  };
  additionalInfo?: {
    address?: string | null;
    profession?: string | null;
    parentNames?: string[] | null;
  };
  dataQuality?: {
    overallConfidence: number;
    fieldConfidences?: Record<string, number>;
    possibleErrors?: string[];
    suggestions?: string[];
  };
  correctedText: string;
}