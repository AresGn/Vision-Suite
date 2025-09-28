/**
 * Service d'optimisation des performances pour les fonctionnalités améliorées
 * Gère la mise en cache, l'optimisation WebGL et le redimensionnement intelligent
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  size: number;
}

interface PerformanceMetrics {
  modelLoadTime: number;
  inferenceTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface OptimizationConfig {
  enableModelCache: boolean;
  enableWebGL: boolean;
  maxCacheSize: number; // en MB
  cacheExpiration: number; // en millisecondes
  intelligentResize: boolean;
  maxImageDimension: number;
}

/**
 * Gestionnaire de cache pour les modèles et résultats
 */
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private currentSize = 0;

  constructor(maxSizeMB: number = 50) {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convertir en bytes
  }

  set(key: string, data: any, size?: number): void {
    const estimatedSize = size || this.estimateSize(data);
    
    // Nettoyer le cache si nécessaire
    this.cleanup(estimatedSize);
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      size: estimatedSize
    };
    
    this.cache.set(key, entry);
    this.currentSize += estimatedSize;
  }

  get(key: string, maxAge?: number): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (maxAge && age > maxAge) {
      this.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  private cleanup(requiredSize: number): void {
    if (this.currentSize + requiredSize <= this.maxSize) return;
    
    // Trier par âge (plus ancien en premier)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    for (const [key, entry] of entries) {
      this.delete(key);
      if (this.currentSize + requiredSize <= this.maxSize) break;
    }
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Estimation approximative
    } catch {
      return 1024; // Taille par défaut
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      utilization: (this.currentSize / this.maxSize) * 100
    };
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}

/**
 * Optimiseur de performance principal
 */
export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private cacheManager: CacheManager;
  private metrics: PerformanceMetrics;
  private webglSupported: boolean | null = null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableModelCache: true,
      enableWebGL: true,
      maxCacheSize: 50,
      cacheExpiration: 30 * 60 * 1000, // 30 minutes
      intelligentResize: true,
      maxImageDimension: 1920,
      ...config
    };

    this.cacheManager = new CacheManager(this.config.maxCacheSize);
    this.metrics = {
      modelLoadTime: 0,
      inferenceTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Optimise une image pour le traitement
   */
  async optimizeImage(file: File): Promise<HTMLCanvasElement> {
    const cacheKey = `optimized_${file.name}_${file.size}`;
    
    // Vérifier le cache
    if (this.config.enableModelCache) {
      const cached = this.cacheManager.get(cacheKey, this.config.cacheExpiration);
      if (cached) {
        return cached;
      }
    }

    const canvas = await this.processImage(file);
    
    // Mettre en cache
    if (this.config.enableModelCache) {
      this.cacheManager.set(cacheKey, canvas);
    }

    return canvas;
  }

  private async processImage(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) {
          reject(new Error('Erreur de lecture du fichier'));
          return;
        }

        img.onload = () => {
          try {
            const canvas = this.resizeImage(img);
            resolve(canvas);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
        img.src = e.target.result as string;
      };

      reader.onerror = () => reject(new Error('Erreur FileReader'));
      reader.readAsDataURL(file);
    });
  }

  private resizeImage(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      throw new Error('Impossible d\'obtenir le contexte canvas');
    }

    let { width, height } = img;

    // Redimensionnement intelligent
    if (this.config.intelligentResize) {
      const maxDim = this.config.maxImageDimension;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Optimisations de rendu
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Dessiner l'image redimensionnée
    ctx.drawImage(img, 0, 0, width, height);

    // Optimisations supplémentaires si nécessaire
    this.enhanceImageQuality(ctx, width, height);

    return canvas;
  }

  private enhanceImageQuality(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Amélioration du contraste et de la luminosité
    for (let i = 0; i < data.length; i += 4) {
      // Conversion en niveaux de gris pour l'analyse
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Amélioration du contraste
      const contrast = 1.1;
      const brightness = 10;
      
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Vérifie et configure le support WebGL
   */
  async checkWebGLSupport(): Promise<boolean> {
    if (this.webglSupported !== null) {
      return this.webglSupported;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      this.webglSupported = !!gl;
      
      if (this.webglSupported && typeof tf !== 'undefined') {
        // Configurer TensorFlow.js pour utiliser WebGL
        await tf.setBackend('webgl');
        console.log('✓ WebGL activé pour TensorFlow.js');
      }
    } catch (error) {
      console.warn('WebGL non supporté:', error);
      this.webglSupported = false;
    }

    return this.webglSupported;
  }

  /**
   * Précharge les modèles pour améliorer les performances
   */
  async preloadModels(modelPaths: string[]): Promise<void> {
    const startTime = performance.now();

    for (const modelPath of modelPaths) {
      const cacheKey = `model_${modelPath}`;
      
      if (this.cacheManager.get(cacheKey)) {
        continue; // Déjà en cache
      }

      try {
        if (typeof tf !== 'undefined') {
          const model = await tf.loadGraphModel(modelPath);
          this.cacheManager.set(cacheKey, model);
          console.log(`✓ Modèle préchargé: ${modelPath}`);
        }
      } catch (error) {
        console.warn(`Échec du préchargement: ${modelPath}`, error);
      }
    }

    this.metrics.modelLoadTime = performance.now() - startTime;
  }

  /**
   * Surveille l'utilisation de la mémoire
   */
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
    }
  }

  /**
   * Nettoie les ressources pour libérer la mémoire
   */
  cleanup(): void {
    this.cacheManager.clear();
    
    // Nettoyer les tenseurs TensorFlow.js si disponible
    if (typeof tf !== 'undefined' && tf.memory) {
      const memInfo = tf.memory();
      if (memInfo.numTensors > 100) { // Seuil arbitraire
        console.warn(`Nombre élevé de tenseurs: ${memInfo.numTensors}`);
      }
    }
  }

  /**
   * Obtient les métriques de performance
   */
  getMetrics(): PerformanceMetrics & { cache: any } {
    this.monitorMemoryUsage();
    
    return {
      ...this.metrics,
      cache: this.cacheManager.getStats()
    };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reconfigurer le cache si nécessaire
    if (newConfig.maxCacheSize) {
      this.cacheManager = new CacheManager(newConfig.maxCacheSize);
    }
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// Instance globale
export const performanceOptimizer = new PerformanceOptimizer();

// Export des types
export type {
  OptimizationConfig,
  PerformanceMetrics
};
