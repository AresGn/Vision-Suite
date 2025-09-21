
import type { FaceComparisonResult, FaceDetection } from '../types';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

interface ModelLoadProgress {
  name: string;
  loaded: boolean;
  error?: string;
}

/**
 * Loads all the required face-api.js models with optimized progressive loading.
 * This function should be called once when the application starts.
 * @param {(message: string, progress: number, models: ModelLoadProgress[]) => void} setLoadingMessage - Callback to update loading message on UI.
 */
export async function loadModels(
  setLoadingMessage: (message: string, progress: number, models: ModelLoadProgress[]) => void
) {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  const models: ModelLoadProgress[] = [
    { name: 'Face Detector', loaded: false },
    { name: 'Face Landmarks', loaded: false },
    { name: 'Face Recognition', loaded: false },
    { name: 'Age & Gender', loaded: false },
    { name: 'Face Expressions', loaded: false },
  ];

  const updateProgress = () => {
    const loadedCount = models.filter(m => m.loaded).length;
    const progress = Math.round((loadedCount / models.length) * 100);
    const currentModel = models.find(m => !m.loaded);
    const message = currentModel ? `Loading ${currentModel.name}...` : 'Models loaded successfully!';
    setLoadingMessage(message, progress, [...models]);
  };

  const loadModelWithRetry = async (
    name: string,
    loader: () => Promise<any>,
    maxRetries = 3
  ): Promise<void> => {
    const modelIndex = models.findIndex(m => m.name === name);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        updateProgress();
        await loader();
        models[modelIndex].loaded = true;
        updateProgress();
        return;
      } catch (error) {
        console.warn(`Failed to load ${name} (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          models[modelIndex].error = `Failed after ${maxRetries} attempts`;
          throw new Error(`Failed to load ${name} after ${maxRetries} attempts`);
        }
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  loadingPromise = (async () => {
    try {
      // Load models in priority order (most important first)
      await loadModelWithRetry('Face Detector', () =>
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      );

      // Load remaining models in parallel for better performance
      await Promise.all([
        loadModelWithRetry('Face Landmarks', () =>
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ),
        loadModelWithRetry('Face Recognition', () =>
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ),
        loadModelWithRetry('Age & Gender', () =>
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ),
        loadModelWithRetry('Face Expressions', () =>
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ),
      ]);

      modelsLoaded = true;
      setLoadingMessage('All models loaded successfully!', 100, models);
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Converts an image file to an HTMLImageElement.
 * @param {File} file - The image file.
 * @returns {Promise<HTMLImageElement>}
 */
const fileToImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                img.src = e.target.result as string;
                img.onload = () => resolve(img);
                img.onerror = reject;
            } else {
                reject(new Error("Failed to read file."));
            }
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Compares two images to determine if they contain the same person.
 * @param {File} imageFile1 - The first image file.
 * @param {File} imageFile2 - The second image file.
 * @returns {Promise<FaceComparisonResult>} - The comparison result.
 */
export const compareFaces = async (imageFile1: File, imageFile2: File): Promise<FaceComparisonResult> => {
    const startTime = performance.now();
    
    const [img1, img2] = await Promise.all([fileToImageElement(imageFile1), fileToImageElement(imageFile2)]);

    const detections1 = await faceapi.detectAllFaces(img1).withFaceLandmarks().withFaceDescriptors();
    if (detections1.length === 0) return { similarity: null, processingTime: performance.now() - startTime, error: 'NO_FACE_1' };
    if (detections1.length > 1) return { similarity: null, processingTime: performance.now() - startTime, error: 'MULTIPLE_FACES_1' };

    const detections2 = await faceapi.detectAllFaces(img2).withFaceLandmarks().withFaceDescriptors();
    if (detections2.length === 0) return { similarity: null, processingTime: performance.now() - startTime, error: 'NO_FACE_2' };
    if (detections2.length > 1) return { similarity: null, processingTime: performance.now() - startTime, error: 'MULTIPLE_FACES_2' };

    const faceMatcher = new faceapi.FaceMatcher(detections1);
    const bestMatch = faceMatcher.findBestMatch(detections2[0].descriptor);

    // Euclidean distance 0 = perfect match. We convert it to a similarity percentage.
    const similarity = (1 - bestMatch.distance) * 100;
    
    return { similarity, processingTime: performance.now() - startTime };
};

/**
 * Detects all faces in an image and estimates their age, gender, and expressions.
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<FaceDetection[]>} - An array of detected faces with details.
 */
export const detectFacesAndDetails = async (imageFile: File): Promise<FaceDetection[]> => {
    const img = await fileToImageElement(imageFile);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withAgeAndGender().withFaceExpressions();

    return detections.map((d: any) => {
        const dominantEmotion = Object.entries(d.expressions as Record<string, number>).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        return {
            age: Math.round(d.age),
            gender: d.gender,
            genderProbability: d.genderProbability,
            expressions: d.expressions,
            dominantEmotion: dominantEmotion,
            box: d.detection.box,
            detectionConfidence: d.detection._score,
        };
    });
};