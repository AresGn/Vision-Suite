
## Guide Complet : Scribe.js et YOLOv11n pour l'Analyse de Documents

### Guide Complet Scribe.js

#### Installation et Configuration

**Installation via NPM**[^1]

```bash
npm install scribe.js-ocr
```

**Configuration de base**[^1]

```javascript
// Import pour le navigateur
import scribe from 'node_modules/scribe.js-ocr/scribe.js';

// Import pour Node.js
import scribe from 'scribe.js-ocr';
```


#### Utilisation Pratique de Scribe.js

**Extraction de texte basique**[^1]

```javascript
// Extraction simple depuis une URL d'image
scribe.extractText(['https://tesseract.projectnaptha.com/img/eng_bw.png'])
    .then((res) => console.log(res));
```

**Analyse de documents PDF et images**[^1]

```javascript
// Exemple complet d'application OCR
async function analyzeDocument() {
    try {
        // Cas 1: PDF avec texte natif
        const textPdf = await scribe.extractText(['document.pdf']);
        console.log('Texte extrait du PDF:', textPdf);

        // Cas 2: Image avec OCR
        const imageOcr = await scribe.extractText(['scan.jpg']);
        console.log('Texte reconnu par OCR:', imageOcr);

        // Cas 3: PDF image-natif avec OCR
        const pdfOcr = await scribe.extractText(['scan.pdf']);
        console.log('Texte OCR du PDF scanné:', pdfOcr);

    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
    }
}
```


#### Fonctionnalités Avancées

**Création de PDF avec couche texte invisible**[^1]

```javascript
// Scribe.js peut insérer du texte dans un PDF existant
// pour le rendre recherchable
async function createSearchablePdf(inputPdf) {
    const result = await scribe.processDocument(inputPdf, {
        addTextLayer: true,
        outputFormat: 'pdf'
    });
    return result;
}
```

**Configuration pour documents d'identité**

```javascript
// Configuration optimisée pour cartes d'identité
const identityCardConfig = {
    language: ['fra', 'eng'], // Support français et anglais
    tesseract: {
        psm: 6, // Mode de segmentation uniforme
        oem: 1  // Moteur LSTM uniquement
    }
};

async function processIdentityCard(imageFile) {
    const result = await scribe.extractText([imageFile], identityCardConfig);
    
    // Extraction des informations structurées
    const extractedData = parseIdentityData(result);
    return extractedData;
}

function parseIdentityData(ocrText) {
    // Regex pour extraire les informations typiques
    const patterns = {
        nom: /(?:NOM|NAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s]+)/i,
        prenom: /(?:PRÉNOM|PRENOM|FIRST NAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝa-z\s]+)/i,
        dateNaissance: /(?:NÉ|NE|BORN)[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
        numeroCI: /(?:N°|NO)[:\s]*(\d{8,12})/i
    };
    
    const extractedInfo = {};
    Object.keys(patterns).forEach(key => {
        const match = ocrText.match(patterns[key]);
        if (match) {
            extractedInfo[key] = match[^1].trim();
        }
    });
    
    return extractedInfo;
}
```


#### Intégration avec Interface Utilisateur

**Interface HTML complète**[^2]

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyseur de Documents d'Identité</title>
    <style>
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-zone { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .results { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .progress { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Analyse de Documents d'Identité</h1>
        
        <div class="upload-zone" onclick="document.getElementById('fileInput').click()">
            <p>Cliquez ici ou glissez votre document d'identité</p>
            <input type="file" id="fileInput" style="display:none" accept="image/*,.pdf">
        </div>
        
        <div class="progress" id="progress">
            <p>Analyse en cours...</p>
        </div>
        
        <div class="results" id="results" style="display:none">
            <h3>Informations extraites :</h3>
            <div id="extractedData"></div>
        </div>
    </div>

    <script type="module">
        import scribe from './node_modules/scribe.js-ocr/scribe.js';
        
        document.getElementById('fileInput').addEventListener('change', processDocument);
        
        async function processDocument(event) {
            const file = event.target.files[^0];
            if (!file) return;
            
            document.getElementById('progress').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            
            try {
                // Conversion du fichier en URL
                const imageUrl = URL.createObjectURL(file);
                
                // Extraction OCR
                const ocrResult = await scribe.extractText([imageUrl]);
                
                // Parsing des données
                const parsedData = parseIdentityData(ocrResult);
                
                // Affichage des résultats
                displayResults(parsedData);
                
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de l\'analyse du document');
            } finally {
                document.getElementById('progress').style.display = 'none';
            }
        }
        
        function displayResults(data) {
            const resultsDiv = document.getElementById('extractedData');
            const html = Object.entries(data)
                .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                .join('');
            resultsDiv.innerHTML = html;
            document.getElementById('results').style.display = 'block';
        }
        
        // Fonction de parsing (reprise de l'exemple précédent)
        function parseIdentityData(ocrText) {
            // ... code de parsing ...
        }
    </script>
</body>
</html>
```


### Guide YOLOv11n Face Detection en JavaScript

#### Étape 1: Conversion du Modèle

**Installation d'Ultralytics**[^3]

```bash
pip install ultralytics
```

**Téléchargement et conversion du modèle YOLOv11n**[^3]

```python
from huggingface_hub import hf_hub_download
from ultralytics import YOLO

# Télécharger le modèle depuis Hugging Face
model_path = hf_hub_download(
    repo_id="AdamCodd/YOLOv11n-face-detection", 
    filename="model.pt"
)

# Charger le modèle
model = YOLO(model_path)

# Exporter vers TensorFlow.js
model.export(format="tfjs")  # Crée un dossier 'yolo11n_web_model'
```


#### Étape 2: Intégration JavaScript

**Configuration de base**[^4]

```javascript
import * as tf from '@tensorflow/tfjs';

class YOLOFaceDetector {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
    }
    
    async loadModel(modelPath) {
        try {
            console.log('Chargement du modèle YOLO...');
            this.model = await tf.loadGraphModel(`${modelPath}/model.json`);
            
            // Réchauffement du modèle avec une entrée fictive
            const dummyInput = tf.zeros([1, 640, 640, 3]);
            await this.model.predict(dummyInput);
            dummyInput.dispose();
            
            this.isModelLoaded = true;
            console.log('Modèle YOLO chargé avec succès');
        } catch (error) {
            console.error('Erreur de chargement du modèle:', error);
            throw error;
        }
    }
    
    async detectFaces(imageElement) {
        if (!this.isModelLoaded) {
            throw new Error('Modèle non chargé');
        }
        
        // Préprocessing de l'image
        const tensor = tf.browser.fromPixels(imageElement)
            .resizeNearestNeighbor([640, 640])
            .expandDims(0)
            .div(255.0);
        
        // Prédiction
        const predictions = await this.model.predict(tensor);
        
        // Post-processing
        const boxes = await predictions.data();
        const detections = this.processDetections(boxes, imageElement.width, imageElement.height);
        
        // Nettoyage
        tensor.dispose();
        predictions.dispose();
        
        return detections;
    }
    
    processDetections(rawOutput, originalWidth, originalHeight) {
        const detections = [];
        const threshold = 0.5; // Seuil de confiance
        
        // Le format de sortie YOLO varie, adaptation nécessaire selon le modèle
        // Cette fonction doit être adaptée selon la structure de sortie exacte
        
        for (let i = 0; i < rawOutput.length; i += 6) { // Exemple: [x, y, w, h, conf, class]
            const confidence = rawOutput[i + 4];
            
            if (confidence > threshold) {
                const x = rawOutput[i] * originalWidth / 640;
                const y = rawOutput[i + 1] * originalHeight / 640;
                const width = rawOutput[i + 2] * originalWidth / 640;
                const height = rawOutput[i + 3] * originalHeight / 640;
                
                detections.push({
                    bbox: { x, y, width, height },
                    confidence: confidence,
                    class: 'face'
                });
            }
        }
        
        return detections;
    }
}
```


#### Étape 3: Application Complète

**Interface utilisateur avec détection en temps réel**[^5]

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détection de Visages YOLOv11n</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <style>
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .video-container { position: relative; display: inline-block; }
        canvas { position: absolute; top: 0; left: 0; }
        .controls { margin: 20px 0; }
        button { padding: 10px 20px; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Détection de Visages avec YOLOv11n</h1>
        
        <div class="controls">
            <button id="startCamera">Démarrer Caméra</button>
            <button id="stopCamera">Arrêter Caméra</button>
            <input type="file" id="imageInput" accept="image/*">
        </div>
        
        <div class="video-container">
            <video id="video" width="640" height="480" style="display:none"></video>
            <canvas id="canvas" width="640" height="480"></canvas>
            <img id="imagePreview" style="max-width: 640px; display:none">
        </div>
        
        <div id="results"></div>
    </div>

    <script type="module">
        import { YOLOFaceDetector } from './yolo-detector.js'; // Fichier séparé
        
        let detector;
        let video;
        let canvas;
        let ctx;
        let stream;
        let isProcessing = false;
        
        async function initializeApp() {
            video = document.getElementById('video');
            canvas = document.getElementById('canvas');
            ctx = canvas.getContext('2d');
            
            // Charger le détecteur YOLO
            detector = new YOLOFaceDetector();
            await detector.loadModel('./models/yolo11n_web_model');
            
            // Event listeners
            document.getElementById('startCamera').addEventListener('click', startCamera);
            document.getElementById('stopCamera').addEventListener('click', stopCamera);
            document.getElementById('imageInput').addEventListener('change', processImage);
        }
        
        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });
                video.srcObject = stream;
                video.style.display = 'block';
                await video.play();
                
                // Démarrer la détection en continu
                detectLoop();
            } catch (error) {
                console.error('Erreur d\'accès à la caméra:', error);
            }
        }
        
        async function detectLoop() {
            if (!stream || isProcessing) return;
            
            isProcessing = true;
            
            try {
                // Dessiner la vidéo sur le canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Détecter les visages
                const detections = await detector.detectFaces(video);
                
                // Dessiner les boîtes englobantes
                drawDetections(detections);
                
                // Afficher les résultats
                displayResults(detections);
                
            } catch (error) {
                console.error('Erreur de détection:', error);
            }
            
            isProcessing = false;
            
            // Continuer la boucle
            if (stream) {
                requestAnimationFrame(detectLoop);
            }
        }
        
        function drawDetections(detections) {
            // Effacer le canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Redessiner la vidéo
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Dessiner les boîtes englobantes
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#00ff00';
            ctx.font = '16px Arial';
            
            detections.forEach(detection => {
                const { x, y, width, height } = detection.bbox;
                
                // Boîte englobante
                ctx.strokeRect(x, y, width, height);
                
                // Label avec confiance
                const label = `Face: ${(detection.confidence * 100).toFixed(1)}%`;
                ctx.fillText(label, x, y - 5);
            });
        }
        
        async function processImage(event) {
            const file = event.target.files[^0];
            if (!file) return;
            
            const img = document.getElementById('imagePreview');
            img.src = URL.createObjectURL(file);
            img.style.display = 'block';
            
            img.onload = async () => {
                try {
                    const detections = await detector.detectFaces(img);
                    
                    // Dessiner les résultats sur le canvas
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    drawDetectionsOnImage(detections, img.width, img.height);
                    
                    displayResults(detections);
                } catch (error) {
                    console.error('Erreur de traitement:', error);
                }
            };
        }
        
        function drawDetectionsOnImage(detections, imgWidth, imgHeight) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            
            detections.forEach(detection => {
                const { x, y, width, height } = detection.bbox;
                
                ctx.strokeRect(x, y, width, height);
                
                const label = `Face: ${(detection.confidence * 100).toFixed(1)}%`;
                ctx.fillText(label, x, y - 10);
            });
        }
        
        function displayResults(detections) {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
                <h3>Résultats de détection:</h3>
                <p>Nombre de visages détectés: ${detections.length}</p>
                ${detections.map((det, i) => 
                    `<p>Visage ${i+1}: Confiance ${(det.confidence * 100).toFixed(1)}%</p>`
                ).join('')}
            `;
        }
        
        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                video.style.display = 'none';
            }
        }
        
        // Initialiser l'application
        initializeApp().catch(console.error);
    </script>
</body>
</html>
```


#### Étape 4: Intégration OCR + Détection de Visages

**Système complet pour documents d'identité**

```javascript
class DocumentAnalyzer {
    constructor() {
        this.yoloDetector = new YOLOFaceDetector();
        this.isInitialized = false;
    }
    
    async initialize() {
        // Charger le modèle YOLO
        await this.yoloDetector.loadModel('./models/yolo11n_web_model');
        this.isInitialized = true;
    }
    
    async analyzeIdentityDocument(imageFile) {
        if (!this.isInitialized) {
            throw new Error('Analyseur non initialisé');
        }
        
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile);
        img.src = imageUrl;
        
        return new Promise((resolve, reject) => {
            img.onload = async () => {
                try {
                    // 1. Détection de visages
                    const faceDetections = await this.yoloDetector.detectFaces(img);
                    
                    // 2. Extraction OCR avec Scribe.js
                    const ocrResult = await scribe.extractText([imageUrl]);
                    const parsedData = this.parseIdentityData(ocrResult);
                    
                    // 3. Combinaison des résultats
                    const result = {
                        faceDetections: faceDetections,
                        extractedText: parsedData,
                        hasValidFace: faceDetections.length > 0,
                        confidence: this.calculateOverallConfidence(faceDetections, parsedData)
                    };
                    
                    // Nettoyage
                    URL.revokeObjectURL(imageUrl);
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
        });
    }
    
    parseIdentityData(ocrText) {
        // Parsing spécialisé pour cartes d'identité françaises
        const patterns = {
            nom: /(?:NOM|SURNAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s-]+)/i,
            prenom: /(?:PRÉNOM|PRENOM|GIVEN NAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝa-z\s-]+)/i,
            dateNaissance: /(?:NÉ|NE LE|BORN)[:\s]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
            lieuNaissance: /(?:À|A|BORN IN)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s-]+)/i,
            numeroCI: /(?:CARTE N°|ID NO)[:\s]*(\d{8,12})/i
        };
        
        const extractedInfo = {};
        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = ocrText.match(pattern);
            if (match) {
                extractedInfo[key] = match[^1].trim();
            }
        });
        
        return extractedInfo;
    }
    
    calculateOverallConfidence(faceDetections, textData) {
        const faceConfidence = faceDetections.length > 0 ? 
            faceDetections.reduce((acc, det) => acc + det.confidence, 0) / faceDetections.length : 0;
        
        const textConfidence = Object.keys(textData).length > 2 ? 0.8 : 0.4;
        
        return (faceConfidence + textConfidence) / 2;
    }
}
```


### Points d'Optimisation et Considérations

#### Performance

**Optimisations recommandées**[^6]

1. **Mise en cache des modèles** : Stocker les modèles en localStorage
2. **WebGL Backend** : Utiliser TensorFlow.js avec WebGL pour l'accélération GPU
3. **Redimensionnement intelligent** : Adapter la taille d'entrée selon l'appareil

#### Limitations et Solutions

**Contraintes identifiées**[^7]

1. **Performance variable** selon les conditions d'éclairage
2. **Optimisé pour visages frontaux** et légèrement inclinés
3. **Performance optimale** pour visages occupant >20 pixels

**Solutions d'amélioration**

```javascript
// Préprocessing d'image pour améliorer les performances
function preprocessImage(canvas, img) {
    const ctx = canvas.getContext('2d');
    
    // Amélioration du contraste
    ctx.filter = 'contrast(1.2) brightness(1.1)';
    ctx.drawImage(img, 0, 0);
    
    return canvas;
}
```

Cette approche combinée de Scribe.js pour l'OCR et YOLOv11n pour la détection de visages vous offre une solution complète et robuste pour l'analyse de documents d'identité en JavaScript, parfaitement adaptée à votre concours.[^5][^3][^1]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://github.com/scribeocr/scribe.js/

[^2]: https://sign.dropbox.com/blog/using-ocr-in-javascript

[^3]: https://docs.ultralytics.com/integrations/tfjs/

[^4]: https://github.com/Hyuto/yolov8-tfjs

[^5]: https://inero-software.com/running-ai-in-client-side-real-time-face-detection-in-the-browser-using-yolo-and-tensorflow-js-use-case-study/

[^6]: https://blog.tensorflow.org/2022/06/ocr-in-browser-using-tensorflowjs.html

[^7]: https://huggingface.co/AdamCodd/YOLOv11n-face-detection

[^8]: https://scribe.knuckles.wtf/laravel/getting-started

[^9]: https://medevel.com/scribe-ocr/

[^10]: https://syntaxscribe.com/blog/getting-started

[^11]: https://github.com/scribeocr

[^12]: https://github.com/sitamgithub-MSIT/YoloDetect

[^13]: https://scribe-js.readthedocs.io

[^14]: http://docs.scribeocr.com/tesseract_users.html

[^15]: https://www.tensorflow.org/js

[^16]: https://scribe.knuckles.wtf/nodejs/

[^17]: https://bestofjs.org/projects/tesseractjs

[^18]: https://github.com/orgs/ultralytics/discussions/13963

[^19]: https://github.com/knuckleswtf/scribe-js

[^20]: https://www.youtube.com/watch?v=kHTasYqs4Tw

[^21]: https://docs.ultralytics.com/guides/model-deployment-options/

[^22]: https://www.npmjs.com/package/@scribe.js/tesseract.js-core

[^23]: https://tesseract.projectnaptha.com

[^24]: https://github.com/datalab-to/surya

[^25]: https://www.youtube.com/watch?v=DSAVCXn2AkI

[^26]: https://justadudewhohacks.github.io/face-api.js/docs/index.html

[^27]: https://blog.filestack.com/javascript-ocr-api-and-ai/

[^28]: https://www.npmjs.com/package/tesseract.js/v/5.1.1?activeTab=code

[^29]: https://fritz.ai/facial-recognition-system-with-javascript/

[^30]: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/read?view=doc-intel-4.0.0

[^31]: https://github.com/scribeocr/scribeocr

[^32]: https://www.tensorflow.org/js/models

[^33]: https://socket.dev/npm/category/server/media-processing/ocr

[^34]: https://blog.tensorflow.org/2021/01/custom-object-detection-in-browser.html

[^35]: https://www.edenai.co/post/how-to-use-ocr-with-javascript

