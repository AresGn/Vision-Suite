# AI Vision Suite

AI Vision Suite is a professional, web-based application designed for a wide range of visual analysis tasks. Built with a modern tech stack, it provides a seamless and intuitive user interface for complex operations like face comparison, age estimation, real-time video analysis, advanced document OCR, and biometric identity verification.

This application was developed to showcase the power of combining client-side machine learning libraries with server-side generative AI for enterprise-grade results.

## ✨ Features

The application is organized into five distinct modules:

### 1. 🎭 Face Comparison
- **Functionality**: Compares two images to determine if they contain the same person.
- **Technology**: Utilizes `face-api.js` for highly accurate facial recognition.
- **Metrics**: Provides a similarity score percentage, a clear "Match" or "No Match" result based on a configurable threshold, and processing time.
- **Error Handling**: Intelligently detects cases with no faces or multiple faces in an image.

### 2. 🎂 Age Estimation
- **Functionality**: Analyzes an image to detect all faces and estimates their age, gender, and dominant emotion.
- **Technology**: Powered by `face-api.js` models.
- **Output**: Displays an annotated image with bounding boxes and labels for each detected face. Provides a summary of the average age and total faces detected.
- **History**: Keeps a history of recent analyses for quick review.

### 3. 📄 OCR Extraction (Hybrid AI)
This is a state-of-the-art module that uses a two-step hybrid AI pipeline for maximum accuracy, with **specialized expertise in processing identity documents from the Republic of Benin**.

- **Step 1: Tesseract.js OCR**:
  - A robust client-side OCR engine (`Tesseract.js`) performs the initial text extraction directly in the browser.
  - Includes image preprocessing options (grayscale, binarization) to improve accuracy.
  - Extracts raw text and performs basic data recognition (emails, dates).

- **Step 2: Gemini AI Enhancement**:
  - The raw text is sent to the **Google Gemini AI** model for advanced analysis and structuring.
  - **Intelligent Correction**: Gemini corrects common OCR errors, normalizes data (e.g., dates, names), and restructures the chaotic text into a clean, structured JSON object.
  - **Specialized Document Logic**: The AI has been trained with specific instructions to understand the unique layouts of Beninese documents like the **CNI (Carte Nationale d'Identité)** and **NPI (Certificat d'Identification Personnelle)**. It correctly identifies and validates data using the MRZ (Machine-Readable Zone) and extracts specific fields like `Filiation`.
  - **Data Quality Analysis**: The AI provides a confidence score, identifies potential errors in the source document, and offers suggestions for manual verification.

### 4. 📹 Real-Time Detection
- **Functionality**: Uses the device's webcam to perform real-time face detection and analysis.
- **Technology**: `face-api.js` running live on the video stream.
- **Features**: Draws bounding boxes and displays age, gender, and emotion for each detected face in real-time.
- **Controls**: Users can start/stop the webcam and toggle different analysis options on the fly. Includes a screenshot feature.

### 5. 🛡️ Real-Time ID Verification
- **Functionality**: A high-security feature that verifies a user's identity by comparing their live face from a webcam against a photo automatically extracted from an uploaded identity document (e.g., Beninese CNI, Passport, CIP).
- **Technology**: Leverages `face-api.js` for both intelligent photo extraction from the document and high-performance, real-time facial comparison.
- **Workflow**:
    1.  User selects the document type and uploads an image of their ID.
    2.  The system automatically crops the photo from the document.
    3.  The user's webcam is activated for a live video feed.
    4.  The application compares the two faces in real-time, displaying a live similarity score and visual feedback.
- **Use Case**: Ideal for online onboarding, proctoring, and any application requiring robust biometric identity verification.

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Face Recognition**: `face-api.js` (client-side via CDN)
- **OCR Engine**: `Tesseract.js` (client-side via CDN)
- **AI Post-Processing**: Google Gemini API (`@google/genai`)

## 🛠️ Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

You need a modern web browser, Node.js (v18+ recommended), and a Google Gemini API Key.

### Installation & Setup

1.  **Clone the code:**
    Clone the repository or download the source files to a folder on your computer.

2.  **Install dependencies:**
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```

3.  **Create the environment file:**
    This project requires a Google Gemini API key.
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```

4.  **Add your API Key:**
    - Open the newly created `.env` file.
    - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.
    ```
    VITE_API_KEY=your_actual_google_gemini_api_key
    ```
    - You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local address provided by Vite (e.g., `http://localhost:5173`).

The application is now running! Any changes you make to the source code will be reflected instantly in the browser.