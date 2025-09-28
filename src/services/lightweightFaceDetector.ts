/**
 * Détecteur de visages léger utilisant face-api.js
 * Alternative à YOLOv11n pour éviter les dépendances lourdes
 */

interface FaceDetection {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  class: string;
}

interface DetectionResult {
  detections: FaceDetection[];
  processingTime: number;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Détecteur de visages léger basé sur face-api.js
 */
export class LightweightFaceDetector {
  private isInitialized = false;
  private confidenceThreshold = 0.5;

  constructor() {
    // Vérifier si face-api.js est disponible
    if (typeof faceapi === 'undefined') {
      console.warn('face-api.js non disponible. Détection de visages désactivée.');
    }
  }

  /**
   * Initialise le détecteur (utilise les modèles déjà chargés par face-api.js)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Vérifier que face-api.js est disponible et que les modèles sont chargés
      if (typeof faceapi === 'undefined') {
        throw new Error('face-api.js non disponible');
      }

      // Les modèles sont déjà chargés par le service principal
      this.isInitialized = true;
      console.log('✓ LightweightFaceDetector initialisé avec face-api.js');
    } catch (error) {
      console.error('Erreur d\'initialisation du détecteur léger:', error);
      throw error;
    }
  }

  /**
   * Détecte les visages dans une image
   */
  async detectFaces(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectionResult> {
    if (!this.isInitialized) {
      throw new Error('Détecteur non initialisé. Appelez initialize() d\'abord.');
    }

    const startTime = performance.now();

    try {
      // Utiliser face-api.js pour détecter les visages
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: this.confidenceThreshold 
        }))
        .withFaceLandmarks();

      // Convertir au format standard
      const faceDetections: FaceDetection[] = detections.map((detection, index) => ({
        bbox: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height
        },
        confidence: detection.detection.score,
        class: 'face'
      }));

      const endTime = performance.now();

      return {
        detections: faceDetections,
        processingTime: endTime - startTime,
        imageWidth: imageElement.width || (imageElement as HTMLCanvasElement).width,
        imageHeight: imageElement.height || (imageElement as HTMLCanvasElement).height
      };
    } catch (error) {
      console.error('Erreur lors de la détection de visages:', error);
      throw new Error(`Échec de la détection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Définit le seuil de confiance
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Vérifie si le détecteur est initialisé
   */
  isLoaded(): boolean {
    return this.isInitialized;
  }

  /**
   * Libère les ressources (pas nécessaire pour face-api.js)
   */
  dispose(): void {
    this.isInitialized = false;
  }
}

// Export des types
export type {
  FaceDetection,
  DetectionResult
};
