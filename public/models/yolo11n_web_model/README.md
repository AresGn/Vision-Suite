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
