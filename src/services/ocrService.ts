import type { TesseractResult, OcrLanguage } from '../types/ocr.types';
import { postProcessText } from './textPostProcessor';

let worker: Tesseract.Worker | null = null;
let currentLang: OcrLanguage | null = null;
let isInitializing = false;
let initializationPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Gets or initializes the Tesseract worker with optimized caching and reuse.
 * @param language The language to be loaded in the worker.
 * @param logger A callback function to handle worker logs and progress.
 * @returns A promise that resolves with the configured Tesseract.Worker instance.
 */
const getWorker = async (language: OcrLanguage, logger: (m: any) => void): Promise<Tesseract.Worker> => {
  // If already initializing, wait for the current initialization
  if (initializationPromise) {
    await initializationPromise;
  }

  // Create worker if it doesn't exist
  if (!worker) {
    initializationPromise = (async () => {
      isInitializing = true;
      try {
        worker = await Tesseract.createWorker({
          logger,
          cachePath: './tesseract-cache', // Enable caching
          gzip: true // Enable compression for faster downloads
        });
        return worker;
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    })();
    await initializationPromise;
  }

  // Load language if different from current
  if (currentLang !== language && worker) {
    initializationPromise = (async () => {
      isInitializing = true;
      try {
        await worker!.loadLanguage(language);
        await worker!.initialize(language);
        await worker!.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
          tessedit_char_whitelist: '', // Allow all characters for better accuracy
          preserve_interword_spaces: '1', // Preserve spaces between words
        });
        currentLang = language;
        return worker!;
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    })();
    await initializationPromise;
  }

  return worker!;
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