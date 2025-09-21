/**
 * Optimized image preprocessing with better algorithms and performance.
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
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return reject(new Error('Could not get canvas context'));

          // Optimize canvas size for better performance while maintaining quality
          const maxDimension = 2000; // Limit max dimension for performance
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));

          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);

          // Use high-quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw scaled image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Apply optimized preprocessing using requestAnimationFrame for better performance
          requestAnimationFrame(() => {
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;

              // Enhanced preprocessing with adaptive thresholding
              const threshold = calculateOtsuThreshold(data);

              for (let i = 0; i < data.length; i += 4) {
                // Convert to grayscale using luminance formula
                const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);

                // Apply adaptive threshold
                const color = gray > threshold ? 255 : 0;

                data[i] = color;     // red
                data[i + 1] = color; // green
                data[i + 2] = color; // blue
                // Alpha channel remains unchanged
              }

              ctx.putImageData(imageData, 0, 0);
              resolve(canvas);
            } catch (error) {
              reject(new Error('Failed to process image data: ' + error));
            }
          });
        } catch (error) {
          reject(new Error('Failed to create canvas: ' + error));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = event.target.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Calculate optimal threshold using Otsu's method for better binarization
 * @param data Image data array
 * @returns Optimal threshold value
 */
function calculateOtsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  const total = data.length / 4; // Total pixels

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[gray]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = i;
    }
  }

  return threshold;
}