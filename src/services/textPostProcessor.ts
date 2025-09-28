import type { ExtractedFields } from '../types/ocr.types';

const REGEX = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g,
  date: /\b\d{1,2}[/-]\d{1,2}[/-](\d{2}|\d{4})\b/g,
};

/**
 * Cleans raw OCR text and extracts structured data.
 * @param rawText The raw string output from Tesseract.
 * @returns An object containing the cleaned text and extracted fields.
 */
export const postProcessText = (rawText: string): { processedText: string; extractedFields: ExtractedFields } => {
  let processedText = rawText;
  
  // Simple common OCR error corrections
  processedText = processedText.replace(/(\d)O(\d)/g, '$10$2'); // e.g., 2O24 ->2025
  processedText = processedText.replace(/\sI\s/g, ' 1 '); // standalone I -> 1
  processedText = processedText.replace(/\b(\w+)rn(\w+)\b/g, '$1m$2'); // rn -> m

  const emails = [...processedText.matchAll(REGEX.email)].map(m => m[0]);
  const phoneNumbers = [...processedText.matchAll(REGEX.phone)].map(m => m[0]);
  const dates = [...processedText.matchAll(REGEX.date)].map(m => m[0]);

  const extractedFields: ExtractedFields = {
    emails: [...new Set(emails)],
    phoneNumbers: [...new Set(phoneNumbers)],
    dates: [...new Set(dates)],
  };

  return { processedText, extractedFields };
};