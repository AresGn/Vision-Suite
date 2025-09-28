#!/bin/bash

# Script d'installation des dépendances pour les nouvelles fonctionnalités
# Scribe.js OCR et YOLOv11n Face Detection

echo "🚀 Installation des dépendances pour AI Vision Suite"
echo "=================================================="

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Vérifier Node.js et npm
if ! command_exists node; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js d'abord."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm n'est pas installé. Veuillez installer npm d'abord."
    exit 1
fi

echo "✓ Node.js et npm sont disponibles"

# Installer les dépendances JavaScript
echo ""
echo "📦 Installation des dépendances JavaScript..."

# TensorFlow.js pour YOLOv11n
echo "🔄 Installation de TensorFlow.js..."
npm install @tensorflow/tfjs --save

if [ $? -eq 0 ]; then
    echo "✓ TensorFlow.js installé"
else
    echo "❌ Échec de l'installation de TensorFlow.js"
    exit 1
fi

# Scribe.js pour OCR avancé
echo "🔄 Installation de Scribe.js..."
npm install scribe.js-ocr --save

if [ $? -eq 0 ]; then
    echo "✓ Scribe.js installé"
else
    echo "⚠️  Échec de l'installation de Scribe.js (peut être normal)"
    echo "   Scribe.js sera chargé via CDN si nécessaire"
fi

# Vérifier Python pour le téléchargement du modèle YOLO
echo ""
echo "🐍 Vérification de Python pour le téléchargement du modèle..."

if command_exists python3; then
    PYTHON_CMD="python3"
elif command_exists python; then
    PYTHON_CMD="python"
else
    echo "❌ Python n'est pas installé. Installation requise pour télécharger le modèle YOLO."
    echo "   Veuillez installer Python 3.7+ et relancer ce script."
    exit 1
fi

echo "✓ Python disponible: $PYTHON_CMD"

# Installer les dépendances Python pour YOLO
echo "🔄 Installation des dépendances Python..."

$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install ultralytics huggingface_hub

if [ $? -eq 0 ]; then
    echo "✓ Dépendances Python installées"
else
    echo "❌ Échec de l'installation des dépendances Python"
    exit 1
fi

# Créer les dossiers nécessaires
echo ""
echo "📁 Création des dossiers..."

mkdir -p public/models/yolo11n_web_model
mkdir -p scripts
mkdir -p src/services

echo "✓ Dossiers créés"

# Télécharger le modèle YOLO
echo ""
echo "📥 Téléchargement du modèle YOLOv11n..."

if [ -f "scripts/download_yolo_model.py" ]; then
    $PYTHON_CMD scripts/download_yolo_model.py
    
    if [ $? -eq 0 ]; then
        echo "✓ Modèle YOLOv11n téléchargé et converti"
    else
        echo "⚠️  Échec du téléchargement du modèle YOLO"
        echo "   Vous pouvez le télécharger manuellement plus tard"
    fi
else
    echo "⚠️  Script de téléchargement non trouvé"
    echo "   Créez le fichier scripts/download_yolo_model.py et relancez"
fi

# Mettre à jour le fichier HTML pour inclure les CDN
echo ""
echo "🔄 Mise à jour du fichier HTML..."

# Vérifier si TensorFlow.js est déjà inclus dans index.html
if ! grep -q "tensorflow" index.html; then
    echo "⚠️  TensorFlow.js n'est pas inclus dans index.html"
    echo "   Ajoutez cette ligne dans la section <head>:"
    echo '   <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>'
fi

# Vérifier si Scribe.js est déjà inclus
if ! grep -q "scribe" index.html; then
    echo "⚠️  Scribe.js n'est pas inclus dans index.html"
    echo "   Vous devrez peut-être ajouter Scribe.js via CDN ou import"
fi

echo ""
echo "✅ Installation terminée!"
echo ""
echo "📋 Résumé:"
echo "  ✓ TensorFlow.js installé"
echo "  ✓ Dépendances Python installées"
echo "  ✓ Dossiers créés"
echo "  ✓ Services implémentés"
echo ""
echo "🔧 Prochaines étapes:"
echo "  1. Vérifiez que le modèle YOLO est téléchargé dans public/models/"
echo "  2. Testez les nouveaux services dans l'interface"
echo "  3. Comparez les performances avec l'implémentation actuelle"
echo ""
echo "🚀 Vous pouvez maintenant utiliser:"
echo "  - DocumentAnalyzer pour l'analyse complète"
echo "  - YOLOFaceDetector pour la détection de visages"
echo "  - ocrScribeService pour l'OCR avancé"
