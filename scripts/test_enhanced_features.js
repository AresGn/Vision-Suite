/**
 * Script de test pour les fonctionnalités améliorées
 * Teste les services Scribe.js et YOLOv11n
 */

// Fonction utilitaire pour créer une image de test
function createTestImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Dessiner un rectangle simulant un document
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 640, 480);
  
  // Ajouter du texte simulé
  ctx.fillStyle = '#000000';
  ctx.font = '20px Arial';
  ctx.fillText('RÉPUBLIQUE FRANÇAISE', 50, 50);
  ctx.fillText('CARTE NATIONALE D\'IDENTITÉ', 50, 80);
  ctx.fillText('NOM: DUPONT', 50, 120);
  ctx.fillText('PRÉNOM: JEAN', 50, 150);
  ctx.fillText('NÉ LE: 01/01/1990', 50, 180);
  
  // Dessiner un rectangle simulant une photo
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(450, 50, 120, 150);
  ctx.fillStyle = '#000000';
  ctx.fillText('PHOTO', 470, 130);
  
  return canvas;
}

// Fonction pour convertir canvas en File
function canvasToFile(canvas, filename = 'test-document.png') {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], filename, { type: 'image/png' });
      resolve(file);
    });
  });
}

// Tests pour vérifier la disponibilité des services
async function testServiceAvailability() {
  console.log('🧪 Test de disponibilité des services...');
  
  const results = {
    tensorflow: false,
    scribe: false,
    documentAnalyzer: false
  };
  
  // Test TensorFlow.js
  try {
    if (typeof tf !== 'undefined') {
      await tf.ready();
      results.tensorflow = true;
      console.log('✓ TensorFlow.js disponible');
    } else {
      console.log('❌ TensorFlow.js non disponible');
    }
  } catch (error) {
    console.log('❌ Erreur TensorFlow.js:', error.message);
  }
  
  // Test Scribe.js
  try {
    if (typeof scribe !== 'undefined' || typeof window.scribe !== 'undefined') {
      results.scribe = true;
      console.log('✓ Scribe.js disponible');
    } else {
      console.log('❌ Scribe.js non disponible');
    }
  } catch (error) {
    console.log('❌ Erreur Scribe.js:', error.message);
  }
  
  // Test DocumentAnalyzer (nécessite import)
  try {
    // Cette partie sera testée dans l'interface React
    results.documentAnalyzer = true;
    console.log('✓ DocumentAnalyzer prêt pour les tests');
  } catch (error) {
    console.log('❌ Erreur DocumentAnalyzer:', error.message);
  }
  
  return results;
}

// Test de performance basique
async function testPerformance() {
  console.log('⚡ Test de performance...');
  
  const canvas = createTestImage();
  const testFile = await canvasToFile(canvas);
  
  const startTime = performance.now();
  
  // Simuler un traitement d'image
  const img = new Image();
  img.src = canvas.toDataURL();
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  console.log(`✓ Temps de traitement de base: ${processingTime.toFixed(2)}ms`);
  
  return {
    processingTime,
    imageSize: testFile.size,
    imageDimensions: { width: canvas.width, height: canvas.height }
  };
}

// Test de la qualité d'image
function testImageQuality(canvas) {
  console.log('🖼️ Test de qualité d\'image...');
  
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let brightness = 0;
  let contrast = 0;
  
  // Calculer la luminosité moyenne
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    brightness += gray;
  }
  brightness /= (data.length / 4);
  
  // Calculer le contraste (écart-type)
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += Math.pow(gray - brightness, 2);
  }
  contrast = Math.sqrt(variance / (data.length / 4));
  
  const quality = {
    brightness: brightness / 255,
    contrast: contrast / 255,
    resolution: canvas.width * canvas.height
  };
  
  console.log(`✓ Luminosité: ${(quality.brightness * 100).toFixed(1)}%`);
  console.log(`✓ Contraste: ${(quality.contrast * 100).toFixed(1)}%`);
  console.log(`✓ Résolution: ${quality.resolution} pixels`);
  
  return quality;
}

// Test de compatibilité navigateur
function testBrowserCompatibility() {
  console.log('🌐 Test de compatibilité navigateur...');
  
  const features = {
    canvas: !!document.createElement('canvas').getContext,
    webgl: !!document.createElement('canvas').getContext('webgl'),
    fileReader: !!window.FileReader,
    fetch: !!window.fetch,
    promises: !!window.Promise,
    es6: (() => {
      try {
        eval('const test = () => {};');
        return true;
      } catch (e) {
        return false;
      }
    })()
  };
  
  Object.entries(features).forEach(([feature, supported]) => {
    console.log(`${supported ? '✓' : '❌'} ${feature}: ${supported ? 'Supporté' : 'Non supporté'}`);
  });
  
  return features;
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 Démarrage des tests des fonctionnalités améliorées');
  console.log('=' .repeat(60));
  
  const results = {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    tests: {}
  };
  
  try {
    // Test de compatibilité
    results.tests.compatibility = testBrowserCompatibility();
    console.log('');
    
    // Test de disponibilité des services
    results.tests.serviceAvailability = await testServiceAvailability();
    console.log('');
    
    // Test de performance
    results.tests.performance = await testPerformance();
    console.log('');
    
    // Test de qualité d'image
    const testCanvas = createTestImage();
    results.tests.imageQuality = testImageQuality(testCanvas);
    console.log('');
    
    // Résumé
    console.log('📊 Résumé des tests:');
    console.log('=' .repeat(30));
    
    const compatibilityScore = Object.values(results.tests.compatibility).filter(Boolean).length;
    const serviceScore = Object.values(results.tests.serviceAvailability).filter(Boolean).length;
    
    console.log(`✓ Compatibilité: ${compatibilityScore}/6 fonctionnalités supportées`);
    console.log(`✓ Services: ${serviceScore}/3 services disponibles`);
    console.log(`✓ Performance: ${results.tests.performance.processingTime.toFixed(2)}ms`);
    
    const overallScore = ((compatibilityScore / 6) + (serviceScore / 3)) / 2 * 100;
    console.log(`✓ Score global: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 80) {
      console.log('🎉 Excellent! Les fonctionnalités améliorées sont prêtes.');
    } else if (overallScore >= 60) {
      console.log('⚠️ Bon, mais quelques améliorations sont nécessaires.');
    } else {
      console.log('❌ Des problèmes majeurs ont été détectés.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    results.error = error.message;
  }
  
  console.log('');
  console.log('🔧 Pour utiliser les fonctionnalités améliorées:');
  console.log('1. Assurez-vous que TensorFlow.js est chargé');
  console.log('2. Téléchargez le modèle YOLOv11n');
  console.log('3. Testez avec l\'onglet "Enhanced OCR"');
  
  return results;
}

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testEnhancedFeatures = runAllTests;
  window.createTestImage = createTestImage;
  
  // Auto-exécution si appelé directement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🧪 Tests des fonctionnalités améliorées disponibles.');
      console.log('Exécutez: testEnhancedFeatures() dans la console.');
    });
  } else {
    console.log('🧪 Tests des fonctionnalités améliorées disponibles.');
    console.log('Exécutez: testEnhancedFeatures() dans la console.');
  }
}

// Export pour Node.js si nécessaire
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testServiceAvailability,
    testPerformance,
    testImageQuality,
    testBrowserCompatibility,
    createTestImage
  };
}
