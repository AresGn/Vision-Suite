
import type { FaceComparisonResult, FaceDetection } from '../types';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

let modelsLoaded = false;

/**
 * Loads all the required face-api.js models from the CDN.
 * This function should be called once when the application starts.
 * @param {(message: string) => void} setLoadingMessage - Callback to update loading message on UI.
 */
export async function loadModels(setLoadingMessage: (message: string) => void) {  
  if (modelsLoaded) return;

  const loadWithStatus = (name: string, loader: Promise<any>) => {
    setLoadingMessage(`Loading ${name}...`);
    return loader;
  };
  
  await Promise.all([
    loadWithStatus('Face Detector', faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)),
    loadWithStatus('Face Landmarks', faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)),
    loadWithStatus('Face Recognition', faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)),
    loadWithStatus('Age & Gender', faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)),
    loadWithStatus('Face Expressions', faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)),
  ]);
  modelsLoaded = true;
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
        const dominantEmotion = Object.entries(d.expressions).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
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