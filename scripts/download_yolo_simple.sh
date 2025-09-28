#!/bin/bash

# Script simple pour télécharger le modèle YOLOv11n depuis Hugging Face
# Sans dépendances Python lourdes

echo "🚀 Téléchargement du modèle YOLOv11n depuis Hugging Face"
echo "======================================================"

# Créer les dossiers nécessaires
mkdir -p public/models/yolo11n_web_model
mkdir -p public/models/cache

# URLs des fichiers du modèle (format TensorFlow.js si disponible)
HUGGINGFACE_REPO="https://huggingface.co/AdamCodd/YOLOv11n-face-detection"
MODEL_FILES=(
    "model.json"
    "model_weights.bin"
    "config.json"
)

echo "📁 Création des dossiers..."
echo "✓ Dossiers créés"

echo ""
echo "🔍 Recherche des fichiers TensorFlow.js..."

# Fonction pour télécharger un fichier
download_file() {
    local url=$1
    local output=$2
    local filename=$(basename "$output")
    
    echo "📥 Téléchargement de $filename..."
    
    if command -v curl >/dev/null 2>&1; then
        curl -L -o "$output" "$url" --fail --silent --show-error
    elif command -v wget >/dev/null 2>&1; then
        wget -O "$output" "$url" --quiet
    else
        echo "❌ Erreur: curl ou wget requis pour télécharger les fichiers"
        return 1
    fi
    
    if [ $? -eq 0 ] && [ -f "$output" ]; then
        local size=$(du -h "$output" | cut -f1)
        echo "✓ $filename téléchargé ($size)"
        return 0
    else
        echo "❌ Échec du téléchargement de $filename"
        return 1
    fi
}

# Essayer de télécharger les fichiers TensorFlow.js
echo "🔄 Tentative de téléchargement des fichiers TensorFlow.js..."

# URLs alternatives pour les fichiers TensorFlow.js
TFJS_URLS=(
    "https://huggingface.co/AdamCodd/YOLOv11n-face-detection/resolve/main/model.json"
    "https://huggingface.co/AdamCodd/YOLOv11n-face-detection/resolve/main/model_weights.bin"
)

success_count=0

for i in "${!TFJS_URLS[@]}"; do
    url="${TFJS_URLS[$i]}"
    filename=$(basename "$url")
    output="public/models/yolo11n_web_model/$filename"
    
    if download_file "$url" "$output"; then
        ((success_count++))
    fi
done

# Si les fichiers TensorFlow.js ne sont pas disponibles, télécharger le modèle PyTorch
if [ $success_count -eq 0 ]; then
    echo ""
    echo "⚠️  Fichiers TensorFlow.js non trouvés, téléchargement du modèle PyTorch..."
    
    pytorch_url="https://huggingface.co/AdamCodd/YOLOv11n-face-detection/resolve/main/model.pt"
    pytorch_output="public/models/cache/yolo11n-face.pt"
    
    if download_file "$pytorch_url" "$pytorch_output"; then
        echo ""
        echo "📋 Instructions pour conversion manuelle:"
        echo "1. Installez Python et ultralytics: pip install ultralytics"
        echo "2. Convertissez avec ce script Python:"
        echo ""
        cat << 'EOF'
from ultralytics import YOLO
import os

# Charger le modèle
model = YOLO('public/models/cache/yolo11n-face.pt')

# Exporter vers TensorFlow.js
try:
    model.export(format='tfjs', imgsz=640)
    print("✓ Modèle converti en TensorFlow.js")
except Exception as e:
    print(f"❌ Erreur de conversion: {e}")
    # Essayer ONNX comme alternative
    model.export(format='onnx', imgsz=640)
    print("✓ Modèle converti en ONNX (conversion manuelle vers TensorFlow.js requise)")
EOF
        echo ""
    else
        echo "❌ Impossible de télécharger le modèle PyTorch"
    fi
fi

# Créer un modèle de fallback léger si rien n'a fonctionné
if [ $success_count -eq 0 ] && [ ! -f "public/models/cache/yolo11n-face.pt" ]; then
    echo ""
    echo "🔄 Création d'un modèle de fallback..."
    
    # Créer un fichier de configuration de base
    cat > public/models/yolo11n_web_model/config.json << 'EOF'
{
  "model_name": "YOLOv11n-face-detection",
  "input_size": [640, 640],
  "classes": ["face"],
  "confidence_threshold": 0.5,
  "iou_threshold": 0.5,
  "status": "fallback",
  "note": "Modèle de fallback - téléchargement manuel requis"
}
EOF
    
    echo "✓ Configuration de fallback créée"
    echo ""
    echo "📋 Pour obtenir le modèle complet:"
    echo "1. Visitez: https://huggingface.co/AdamCodd/YOLOv11n-face-detection"
    echo "2. Téléchargez manuellement les fichiers model.json et model_weights.bin"
    echo "3. Placez-les dans public/models/yolo11n_web_model/"
fi

# Créer un fichier README
cat > public/models/yolo11n_web_model/README.md << 'EOF'
# YOLOv11n Face Detection Model

## Informations
- **Modèle**: YOLOv11n-face-detection
- **Source**: AdamCodd/YOLOv11n-face-detection (Hugging Face)
- **Format**: TensorFlow.js
- **Taille d'entrée**: 640x640
- **Classes**: face (visage)

## Utilisation
Le modèle est optimisé pour la détection de visages en temps réel dans le navigateur.

## Performance
- **Précision**: Optimisée pour les visages frontaux et légèrement inclinés
- **Vitesse**: Rapide grâce à l'architecture YOLOv11n
- **Taille minimale**: >20 pixels pour une détection optimale

## Configuration recommandée
- Seuil de confiance: 0.5
- Suppression non-maximale: IoU 0.5
- Backend: WebGL (avec fallback CPU)

## Téléchargement manuel
Si le téléchargement automatique a échoué:
1. Visitez: https://huggingface.co/AdamCodd/YOLOv11n-face-detection
2. Téléchargez les fichiers model.json et model_weights.bin
3. Placez-les dans ce dossier
EOF

echo ""
echo "✅ Script terminé!"
echo ""
echo "📊 Résumé:"
if [ $success_count -gt 0 ]; then
    echo "  ✓ $success_count fichier(s) TensorFlow.js téléchargé(s)"
    echo "  ✓ Modèle prêt à utiliser"
elif [ -f "public/models/cache/yolo11n-face.pt" ]; then
    echo "  ✓ Modèle PyTorch téléchargé"
    echo "  ⚠️  Conversion vers TensorFlow.js requise"
else
    echo "  ⚠️  Téléchargement automatique échoué"
    echo "  📋 Téléchargement manuel requis"
fi

echo ""
echo "📁 Fichiers dans public/models/yolo11n_web_model/:"
ls -la public/models/yolo11n_web_model/ 2>/dev/null || echo "  (dossier vide)"

echo ""
echo "🔧 Prochaines étapes:"
echo "  1. Vérifiez les fichiers téléchargés"
echo "  2. Testez avec l'onglet Enhanced OCR"
echo "  3. Consultez la console pour les erreurs éventuelles"
