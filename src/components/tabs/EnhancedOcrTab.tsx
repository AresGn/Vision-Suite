import React, { useState, useCallback, useEffect } from 'react';
import ImageDropzone from '../ui/ImageDropzone';
import Spinner from '../ui/Spinner';
import { LightweightDocumentAnalyzer } from '../../services/lightweightDocumentAnalyzer';
import type {
  ComprehensiveAnalysisResult,
  AnalysisOptions,
  DocumentQuality
} from '../../services/lightweightDocumentAnalyzer';

interface EnhancedOcrTabProps {
  modelsLoaded: boolean;
}

const EnhancedOcrTab: React.FC<EnhancedOcrTabProps> = ({ modelsLoaded }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [analyzer, setAnalyzer] = useState<LightweightDocumentAnalyzer | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    enableFaceDetection: true,
    enableOCR: true,
    faceConfidenceThreshold: 0.5,
    preprocessImage: true
  });

  // Initialiser l'analyseur de documents
  useEffect(() => {
    const initializeAnalyzer = async () => {
      if (!modelsLoaded) return;
      
      setIsInitializing(true);
      setError(null);
      
      try {
        const documentAnalyzer = new LightweightDocumentAnalyzer();
        await documentAnalyzer.initialize();
        setAnalyzer(documentAnalyzer);
        console.log('✓ LightweightDocumentAnalyzer initialisé');
      } catch (err: any) {
        setError(`Erreur d'initialisation: ${err.message}`);
        console.error('Erreur d\'initialisation de LightweightDocumentAnalyzer:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAnalyzer();

    // Nettoyage
    return () => {
      if (analyzer) {
        analyzer.dispose();
      }
    };
  }, [modelsLoaded]);

  const handleImageDrop = useCallback((file: File) => {
    setImage(file);
    setResult(null);
    setError(null);
    
    // Créer l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!image || !analyzer) {
      setError('Veuillez sélectionner une image et attendre l\'initialisation.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 Début de l\'analyse complète...');
      const analysisResult = await analyzer.analyzeDocument(image, analysisOptions);
      setResult(analysisResult);
      console.log('✓ Analyse terminée:', analysisResult);
    } catch (err: any) {
      setError(`Erreur d'analyse: ${err.message}`);
      console.error('Erreur d\'analyse:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const getQualityColor = (quality: DocumentQuality['overallQuality']) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatProcessingTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Initialisation des services améliorés...</p>
          <p className="text-sm text-gray-500">Chargement de face-api.js et Tesseract.js</p>
        </div>
      </div>
    );
  }

  if (!analyzer) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Services améliorés non disponibles</h3>
        <p className="text-gray-600 mb-4">Les services face-api.js et Tesseract.js n'ont pas pu être initialisés.</p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <p className="text-sm text-gray-500">
          Vérifiez que les dépendances sont installées et que les modèles sont disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analyse Avancée de Documents
        </h2>
        <p className="text-gray-600">
          Combinaison de Tesseract.js OCR et face-api.js pour une analyse complète des documents d'identité
        </p>
      </div>

      {/* Options d'analyse */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Options d'analyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={analysisOptions.enableOCR}
              onChange={(e) => setAnalysisOptions(prev => ({ ...prev, enableOCR: e.target.checked }))}
              className="mr-2"
            />
            Extraction de texte (Tesseract.js OCR)
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={analysisOptions.enableFaceDetection}
              onChange={(e) => setAnalysisOptions(prev => ({ ...prev, enableFaceDetection: e.target.checked }))}
              className="mr-2"
            />
            Détection de visages (face-api.js)
          </label>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Seuil de confiance:</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={analysisOptions.faceConfidenceThreshold}
              onChange={(e) => setAnalysisOptions(prev => ({ ...prev, faceConfidenceThreshold: parseFloat(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600">{analysisOptions.faceConfidenceThreshold}</span>
          </div>
        </div>
      </div>

      {/* Zone de dépôt d'image */}
      <ImageDropzone 
        onImageDrop={handleImageDrop} 
        imagePreviewUrl={imagePreview}
        id="enhanced-ocr-upload"
      />

      {/* Boutons d'action */}
      <div className="flex space-x-4">
        <button
          onClick={handleAnalyze}
          disabled={!image || isProcessing}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">Analyse en cours...</span>
            </>
          ) : (
            '🚀 Analyser avec les services améliorés'
          )}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          Effacer
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">Erreur</p>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="space-y-6">
          {/* Résumé de l'analyse */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4">Résumé de l'analyse</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(result.overallConfidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confiance globale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatProcessingTime(result.processingTime)}
                </div>
                <div className="text-sm text-gray-600">Temps de traitement</div>
              </div>
              <div className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(result.documentQuality.overallQuality)}`}>
                  {result.documentQuality.overallQuality}
                </div>
                <div className="text-sm text-gray-600 mt-1">Qualité du document</div>
              </div>
            </div>
          </div>

          {/* Données extraites */}
          {Object.keys(result.ocrResult.extractedData).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Informations extraites</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.ocrResult.extractedData).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <div className="text-sm font-medium text-gray-700 capitalize">{key}</div>
                    <div className="text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détection de visages */}
          {result.faceDetections.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Détection de visages</h3>
              <div className="space-y-2">
                <p className="text-gray-600">
                  {result.faceCount} visage(s) détecté(s) en {formatProcessingTime(result.faceDetectionTime)}
                </p>
                {result.faceDetections.map((face, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <div className="text-sm">
                      <span className="font-medium">Visage {index + 1}:</span> 
                      <span className="ml-2">Confiance: {Math.round(face.confidence * 100)}%</span>
                      <span className="ml-4">Position: ({Math.round(face.bbox.x)}, {Math.round(face.bbox.y)})</span>
                      <span className="ml-4">Taille: {Math.round(face.bbox.width)}×{Math.round(face.bbox.height)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {result.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommandations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Problèmes détectés */}
          {result.documentQuality.issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">Problèmes détectés</h3>
              <ul className="space-y-2">
                {result.documentQuality.issues.map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-800">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedOcrTab;
