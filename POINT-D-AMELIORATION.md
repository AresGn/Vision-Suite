--- START OF FILE POINT-D-AMELIORATION.md ---
# Pistes d'Amélioration pour AI Vision Suite

Ce document décrit les prochaines étapes et les améliorations potentielles pour faire de AI Vision Suite une solution encore plus puissante et complète.

## 1. Extension de la Reconnaissance de Documents

L'un des axes d'amélioration les plus importants est d'étendre la capacité de l'IA à reconnaître une plus grande variété de documents.

### Procédure pour Ajouter un Nouveau Document (Ex: Acte de Naissance)

1.  **Collecter des Exemples**: Rassembler plusieurs images de haute qualité du nouveau type de document (par exemple, un "Acte de Naissance Sécurisé" du Bénin).
2.  **Analyser la Structure**: Identifier les champs clés (ex: "Numéro de l'acte", "Noms des parents", "Date de déclaration", "Officier d'état civil") et leur disposition sur le document.
3.  **Mettre à Jour le Prompt Gemini**: Dans `utils/geminiPrompts.ts`, ajouter une nouvelle section dans les instructions spécifiques, comme celles pour la CNI et le NPI.
    ```javascript
    // Exemple d'ajout dans le prompt
    ### For "Acte de Naissance Sécurisé" from Benin:
    -   **Key Identifier**: The document number is often labeled "N°".
    -   **Parental Information**: Extract "Père" and "Mère" information.
    -   **Official Details**: Extract "Déclarant" (Declarant) and "Officier de l'état civil" (Civil Status Officer).
    ```
4.  **Mettre à Jour les Types TypeScript**: Si le nouveau document contient des champs qui n'existent pas encore, les ajouter dans `types/ocr.types.ts` au sein des interfaces `GeminiExtractedFields` ou `AdditionalInfo`.
5.  **Mettre à Jour l'Interface Utilisateur**: Modifier le composant `components/ocr/StructuredResultsViewer.tsx` pour qu'il affiche correctement ces nouveaux champs.

## 2. Amélioration de la Précision de l'OCR

Bien que Tesseract soit puissant, sa précision peut être encore améliorée en amont de l'analyse par Gemini.

-   **Pré-traitement d'Image Avancé**: Intégrer une librairie comme **OpenCV.js** pour appliquer des filtres plus sophistiqués avant l'OCR :
    -   **Deskewing**: Correction automatique de l'inclinaison des documents scannés de travers.
    -   **Correction de Perspective**: Redressement des photos de documents prises en angle.
    -   **Binarisation Adaptative**: Une méthode de conversion en noir et blanc plus intelligente qui s'adapte aux variations de luminosité sur le document.
-   **Entraînement de Modèles Tesseract Personnalisés**: Pour des documents très spécifiques ou utilisant des polices rares, il est possible d'entraîner un modèle Tesseract personnalisé pour améliorer considérablement la reconnaissance de caractères.

## 3. Nouvelles Fonctionnalités de Workflow et de Sécurité

-   **Gestion des Documents Protégés par Mot de Passe**:
    -   Ajouter la prise en charge des fichiers PDF.
    -   Si un PDF est protégé, afficher une boîte de dialogue demandant à l'utilisateur de saisir le mot de passe.
    -   Utiliser une librairie comme **PDF.js** pour déchiffrer le document côté client avant de l'envoyer au pipeline de traitement d'image et d'OCR.
-   **Traitement par Lot (Batch Processing)**:
    -   Permettre à l'utilisateur de glisser-déposer plusieurs fichiers à la fois.
    -   Créer une file d'attente de traitement et afficher les résultats pour chaque document dans une liste, avec un résumé global.
-   **Export Avancé**:
    -   **Export PDF Annoté**: Générer un fichier PDF contenant l'image originale avec les données extraites superposées de manière invisible (texte "copiable-collable").
    -   **Export DOCX/CSV**: Permettre l'export des données extraites (en particulier pour le traitement par lot) dans des formats exploitables comme le CSV ou le DOCX.

## 4. Améliorations de l'Expérience Utilisateur (UX)

-   **Dashboard Analytique**: Créer un onglet "Analytics" qui pourrait suivre :
    -   Le taux de réussite moyen de l'OCR.
    -   Le temps de traitement moyen par type de document.
    -   Les erreurs les plus fréquemment détectées par Gemini.
-   **Édition "In-place"**: Permettre à l'utilisateur de cliquer directement sur un champ dans les résultats structurés pour le corriger manuellement. Ces corrections pourraient (dans une version future) servir à affiner les prompts de manière adaptative.
--- END OF FILE POINT-D-AMELIORATION.md ---