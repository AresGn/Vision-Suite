import type { TesseractResult, OcrLanguage } from '../types/ocr.types';
import { postProcessText } from './textPostProcessor';

let worker: Tesseract.Worker | null = null;
let currentLang: OcrLanguage | null = null;
let isInitializing = false;

/**
 * Gets or initializes the Tesseract worker, ensuring the correct language is loaded.
 * @param language The language to be loaded in the worker.
 * @param logger A callback function to handle worker logs and progress.
 * @returns A promise that resolves with the configured Tesseract.Worker instance.
 */
const getWorker = async (language: OcrLanguage, logger: (m: any) => void) => {
  if (isInitializing) {
    // Wait for the current initialization to finish
    await new Promise(resolve => setTimeout(resolve, 100));
    return getWorker(language, logger);
  }

  if (!worker) {
    isInitializing = true;
    worker = await Tesseract.createWorker({ logger });
    isInitializing = false;
  }
  
  if (currentLang !== language) {
    isInitializing = true;
    await worker.loadLanguage(language);
    await worker.initialize(language);
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
    });
    currentLang = language;
    isInitializing = false;
  }
  return worker;
};

/**
 * Recognizes text in an image using a Tesseract.js worker.
 * @param image The image file or preprocessed canvas.
 * @param language The language of the text in the image.
 * @param onProgress A callback to report progress updates.
 * @returns A promise resolving to an TesseractResult object.
 */
export const recognizeText = async (
  image: File | HTMLCanvasElement,
  language: OcrLanguage,
  onProgress: (progress: { status: string; progress: number }) => void
): Promise<TesseractResult> => {
  const logger = (m: any) => {
    onProgress({ status: m.status, progress: m.progress ? Math.round(m.progress * 100) : 0 });
  };

  const activeWorker = await getWorker(language, logger);

  const startTime = performance.now();
  const { data } = await activeWorker.recognize(image);
  const endTime = performance.now();

  const { processedText, extractedFields } = postProcessText(data.text);

  return {
    rawText: data.text,
    processedText,
    confidence: data.confidence,
    words: data.words,
    extractedFields,
    processingTime: endTime - startTime,
    language,
  };
};

/**
 * Terminates the active Tesseract worker to free up resources.
 */
export const terminateWorker = async () => {
  await worker?.terminate();
  worker = null;
  currentLang = null;
};