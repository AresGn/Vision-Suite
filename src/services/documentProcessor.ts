/**
 * Preprocesses an image file by converting it to a canvas and applying
 * basic filters like grayscale and binarization to improve OCR quality.
 * @param file The image file to process.
 * @returns A promise that resolves with the processed HTMLCanvasElement.
 */
export const preprocessImage = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read image file.'));
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject('Could not get canvas context');

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Grayscale and Binarization (simple thresholding)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // A weighted average is generally better than a simple average
          const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const color = avg > 128 ? 255 : 0; // Simple threshold
          data[i] = color;     // red
          data[i + 1] = color; // green
          data[i + 2] = color; // blue
        }
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = event.target.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error.'));
    reader.readAsDataURL(file);
  });
};