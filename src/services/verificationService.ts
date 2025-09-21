
import { BENIN_DOCUMENTS } from '../utils/documentTemplates';
import type { DocumentType, PhotoExtractionResult, PhotoRegion, VerificationResult, FaceMatch } from '../types/verification.types';

const fileToImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                img.src = e.target.result as string;
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(new Error("Failed to load image from file."));
            } else {
                reject(new Error("Failed to read file."));
            }
        };
        reader.onerror = () => reject(new Error("FileReader failed."));
        reader.readAsDataURL(file);
    });
};

const cropImageToCanvas = (image: HTMLImageElement, region: PhotoRegion): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    const sx = image.naturalWidth * region.x;
    const sy = image.naturalHeight * region.y;
    const sWidth = image.naturalWidth * region.width;
    const sHeight = image.naturalHeight * region.height;
    
    canvas.width = sWidth;
    canvas.height = sHeight;
    
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    return canvas;
};

export const extractPhotoFromDocument = async (documentFile: File, documentType: DocumentType): Promise<PhotoExtractionResult> => {
    const template = BENIN_DOCUMENTS[documentType];
    if (!template) throw new Error(`Unsupported document type: ${documentType}`);

    const docImage = await fileToImageElement(documentFile);
    const regions = [template.photoRegion, ...template.fallbackRegions];
    
    for (const region of regions) {
        try {
            const photoCanvas = cropImageToCanvas(docImage, region);
            
            const detection = await faceapi
                .detectSingleFace(photoCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                return {
                    extractedPhotoCanvas: photoCanvas,
                    faceDescriptor: detection.descriptor,
                    confidence: detection.detection.score,
                    documentType: documentType,
                };
            }
        } catch (error) {
            console.warn(`Failed to process region`, region, error);
            // Continue to next region
        }
    }

    throw new Error('No valid face could be extracted from the document. Please try a clearer image.');
};

export const verifyFaceAgainstStream = async (
    videoElement: HTMLVideoElement, 
    referenceDescriptor: Float32Array, 
    similarityThreshold: number = 0.55 // face-api.js euclidean distance threshold is ~0.6, so similarity > 0.4 is a good start
): Promise<VerificationResult> => {
    const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (detections.length === 0) {
        return { status: 'NO_FACE', similarity: 0 };
    }

    const faceMatcher = new faceapi.FaceMatcher(referenceDescriptor);
    const matches = detections.map(d => {
        const bestMatch = faceMatcher.findBestMatch(d.descriptor);
        return {
            detection: d,
            similarity: 1 - bestMatch.distance, // Convert distance to similarity
            confidence: d.detection.score,
        };
    });

    const bestMatch = matches.reduce((best, current) => current.similarity > best.similarity ? current : best);
    
    const isVerified = bestMatch.similarity >= similarityThreshold;

    return {
        status: isVerified ? 'VERIFIED' : 'NOT_VERIFIED',
        similarity: bestMatch.similarity,
        bestMatch: bestMatch,
        allFaces: matches
    };
};