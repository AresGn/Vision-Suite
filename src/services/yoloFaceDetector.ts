/**
 * YOLOv11n Face Detection Service
 * Advanced face detection using YOLOv11n model with TensorFlow.js
 */

// Types pour TensorFlow.js
interface TensorFlowModel {
  predict: (input: any) => any;
  dispose: () => void;
}

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

// Global TensorFlow.js declaration
declare global {
  var tf: {
    loadGraphModel: (modelUrl: string) => Promise<TensorFlowModel>;
    browser: {
      fromPixels: (element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => any;
    };
    zeros: (shape: number[]) => any;
    dispose: (tensor: any) => void;
    ready: () => Promise<void>;
    setBackend: (backend: string) => Promise<boolean>;
  };
}

/**
 * Classe principale pour la détection de visages avec YOLOv11n
 */
export class YOLOFaceDetector {
  private model: TensorFlowModel | null = null;
  private isModelLoaded = false;
  private modelPath: string;
  private inputSize = 640; // Taille d'entrée standard pour YOLO
  private confidenceThreshold = 0.5;

  constructor(modelPath: string = './models/yolo11n_web_model') {
    this.modelPath = modelPath;
  }

  /**
   * Vérifie si TensorFlow.js est disponible
   */
  private isTensorFlowAvailable(): boolean {
    return typeof tf !== 'undefined';
  }

  /**
   * Charge TensorFlow.js si nécessaire
   */
  private async loadTensorFlowIfNeeded(): Promise<void> {
    if (this.isTensorFlowAvailable()) return;

    // Si nous sommes dans un environnement Node.js
    if (typeof window === 'undefined') {
      try {
        const tfModule = await import('@tensorflow/tfjs');
        (global as any).tf = tfModule;
      } catch (error) {
        throw new Error('TensorFlow.js not available. Please install @tensorflow/tfjs package.');
      }
    } else {
      // Dans le navigateur, TensorFlow.js doit être chargé via CDN
      throw new Error('TensorFlow.js not loaded. Please include TensorFlow.js in your HTML.');
    }
  }

  /**
   * Configure le backend TensorFlow.js pour de meilleures performances
   */
  private async setupBackend(): Promise<void> {
    await tf.ready();
    
    try {
      // Essayer d'utiliser WebGL pour l'accélération GPU
      const webglSuccess = await tf.setBackend('webgl');
      if (webglSuccess) {
        console.log('YOLOv11n: Utilisation du backend WebGL pour l\'accélération GPU');
        return;
      }
    } catch (error) {
      console.warn('YOLOv11n: Échec du backend WebGL, utilisation du CPU');
    }
    
    // Fallback vers CPU
    await tf.setBackend('cpu');
    console.log('YOLOv11n: Utilisation du backend CPU');
  }

  /**
   * Charge le modèle YOLOv11n
   */
  async loadModel(modelPath?: string): Promise<void> {
    if (this.isModelLoaded) return;

    await this.loadTensorFlowIfNeeded();
    await this.setupBackend();

    const path = modelPath || this.modelPath;
    
    try {
      console.log('Chargement du modèle YOLOv11n...');
      this.model = await tf.loadGraphModel(`${path}/model.json`);
      
      // Réchauffement du modèle avec une entrée fictive
      console.log('Réchauffement du modèle...');
      const dummyInput = tf.zeros([1, this.inputSize, this.inputSize, 3]);
      const warmupResult = this.model.predict(dummyInput);
      
      // Nettoyer les tenseurs
      tf.dispose(dummyInput);
      if (Array.isArray(warmupResult)) {
        warmupResult.forEach(tensor => tf.dispose(tensor));
      } else {
        tf.dispose(warmupResult);
      }
      
      this.isModelLoaded = true;
      console.log('Modèle YOLOv11n chargé avec succès');
    } catch (error) {
      console.error('Erreur de chargement du modèle YOLOv11n:', error);
      throw new Error(`Échec du chargement du modèle: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Détecte les visages dans une image
   */
  async detectFaces(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectionResult> {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('Modèle YOLOv11n non chargé. Appelez loadModel() d\'abord.');
    }

    const startTime = performance.now();
    
    try {
      // Préprocessing de l'image
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([this.inputSize, this.inputSize])
        .expandDims(0)
        .div(255.0);

      // Prédiction
      const predictions = this.model.predict(tensor);
      
      // Post-processing
      const rawOutput = await (Array.isArray(predictions) ? predictions[0] : predictions).data();
      const detections = this.processDetections(
        rawOutput as Float32Array,
        imageElement.width || (imageElement as HTMLCanvasElement).width,
        imageElement.height || (imageElement as HTMLCanvasElement).height
      );

      // Nettoyage des tenseurs
      tf.dispose(tensor);
      if (Array.isArray(predictions)) {
        predictions.forEach(tensor => tf.dispose(tensor));
      } else {
        tf.dispose(predictions);
      }

      const endTime = performance.now();

      return {
        detections,
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
   * Traite les sorties brutes du modèle YOLO
   */
  private processDetections(rawOutput: Float32Array, originalWidth: number, originalHeight: number): FaceDetection[] {
    const detections: FaceDetection[] = [];
    
    // Le format de sortie YOLO peut varier selon le modèle exact
    // Cette implémentation suppose un format [x, y, w, h, conf, class]
    const numDetections = rawOutput.length / 6; // 6 valeurs par détection
    
    for (let i = 0; i < numDetections; i++) {
      const baseIndex = i * 6;
      const confidence = rawOutput[baseIndex + 4];
      
      if (confidence > this.confidenceThreshold) {
        // Conversion des coordonnées normalisées vers les coordonnées de l'image originale
        const x = (rawOutput[baseIndex] * originalWidth) / this.inputSize;
        const y = (rawOutput[baseIndex + 1] * originalHeight) / this.inputSize;
        const width = (rawOutput[baseIndex + 2] * originalWidth) / this.inputSize;
        const height = (rawOutput[baseIndex + 3] * originalHeight) / this.inputSize;
        
        detections.push({
          bbox: {
            x: Math.max(0, x - width / 2), // Convertir du centre vers le coin supérieur gauche
            y: Math.max(0, y - height / 2),
            width: Math.min(width, originalWidth - x),
            height: Math.min(height, originalHeight - y)
          },
          confidence,
          class: 'face'
        });
      }
    }
    
    // Appliquer la suppression non-maximale pour éliminer les détections en double
    return this.applyNonMaxSuppression(detections);
  }

  /**
   * Applique la suppression non-maximale pour éliminer les détections en double
   */
  private applyNonMaxSuppression(detections: FaceDetection[], iouThreshold = 0.5): FaceDetection[] {
    if (detections.length === 0) return [];
    
    // Trier par confiance décroissante
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const keep: FaceDetection[] = [];
    const suppressed = new Set<number>();
    
    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;
      
      keep.push(detections[i]);
      
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        
        const iou = this.calculateIoU(detections[i].bbox, detections[j].bbox);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  /**
   * Calcule l'Intersection over Union (IoU) entre deux boîtes englobantes
   */
  private calculateIoU(box1: FaceDetection['bbox'], box2: FaceDetection['bbox']): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }

  /**
   * Définit le seuil de confiance pour les détections
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Libère les ressources du modèle
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isModelLoaded = false;
    }
  }

  /**
   * Vérifie si le modèle est chargé
   */
  isLoaded(): boolean {
    return this.isModelLoaded;
  }
}

// Export des types pour utilisation dans d'autres modules
export type {
  FaceDetection,
  DetectionResult
};
