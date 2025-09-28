#!/usr/bin/env python3
"""
Script pour télécharger et convertir le modèle YOLOv11n-face-detection
depuis Hugging Face vers le format TensorFlow.js
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Vérifie que les dépendances nécessaires sont installées"""
    try:
        import ultralytics
        print("✓ Ultralytics installé")
    except ImportError:
        print("❌ Ultralytics non installé. Installation en cours...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics"])
        print("✓ Ultralytics installé")
    
    try:
        from huggingface_hub import hf_hub_download
        print("✓ Hugging Face Hub installé")
    except ImportError:
        print("❌ Hugging Face Hub non installé. Installation en cours...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
        print("✓ Hugging Face Hub installé")

def download_model():
    """Télécharge le modèle YOLOv11n depuis Hugging Face"""
    try:
        from huggingface_hub import hf_hub_download
        from ultralytics import YOLO
        
        print("📥 Téléchargement du modèle YOLOv11n-face-detection...")
        
        # Télécharger le modèle depuis Hugging Face
        model_path = hf_hub_download(
            repo_id="AdamCodd/YOLOv11n-face-detection", 
            filename="model.pt",
            cache_dir="./models/cache"
        )
        
        print(f"✓ Modèle téléchargé: {model_path}")
        
        # Charger le modèle
        print("🔄 Chargement du modèle YOLO...")
        model = YOLO(model_path)
        print("✓ Modèle YOLO chargé")
        
        # Créer le dossier de destination
        output_dir = Path("./public/models/yolo11n_web_model")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Exporter vers TensorFlow.js
        print("🔄 Conversion vers TensorFlow.js...")
        try:
            # Essayer d'exporter directement vers TensorFlow.js
            export_path = model.export(format="tfjs", imgsz=640)
            print(f"✓ Modèle exporté vers: {export_path}")
            
            # Déplacer les fichiers vers le dossier public
            import shutil
            if os.path.exists(export_path):
                # Copier tous les fichiers du dossier exporté
                for file in os.listdir(export_path):
                    src = os.path.join(export_path, file)
                    dst = output_dir / file
                    shutil.copy2(src, dst)
                    print(f"✓ Copié: {file}")
                
                print(f"✓ Modèle TensorFlow.js disponible dans: {output_dir}")
            else:
                print("❌ Dossier d'export non trouvé")
                
        except Exception as e:
            print(f"❌ Erreur lors de l'export TensorFlow.js: {e}")
            print("🔄 Tentative d'export vers ONNX puis conversion...")
            
            try:
                # Export vers ONNX comme alternative
                onnx_path = model.export(format="onnx", imgsz=640)
                print(f"✓ Modèle exporté en ONNX: {onnx_path}")
                
                # Instructions pour conversion manuelle
                print("\n📋 Instructions pour conversion manuelle:")
                print("1. Installez tensorflowjs: pip install tensorflowjs")
                print("2. Convertissez avec: tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model --signature_name=serving_default --saved_model_tags=serve [MODEL_DIR] [OUTPUT_DIR]")
                
            except Exception as e2:
                print(f"❌ Erreur lors de l'export ONNX: {e2}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du téléchargement: {e}")
        return False

def create_model_info():
    """Crée un fichier d'information sur le modèle"""
    info_content = """# YOLOv11n Face Detection Model

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
"""
    
    info_path = Path("./public/models/yolo11n_web_model/README.md")
    info_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(info_path, 'w', encoding='utf-8') as f:
        f.write(info_content)
    
    print(f"✓ Informations du modèle créées: {info_path}")

def main():
    """Fonction principale"""
    print("🚀 Téléchargement et conversion du modèle YOLOv11n")
    print("=" * 50)
    
    # Vérifier les dépendances
    check_dependencies()
    
    # Télécharger et convertir le modèle
    if download_model():
        create_model_info()
        print("\n✅ Processus terminé avec succès!")
        print("📁 Le modèle est disponible dans: ./public/models/yolo11n_web_model/")
        print("🔧 Vous pouvez maintenant utiliser le service YOLOFaceDetector")
    else:
        print("\n❌ Échec du processus")
        sys.exit(1)

if __name__ == "__main__":
    main()
