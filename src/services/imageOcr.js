/**
 * LabelSure Client-Side In-Browser Optical Character Recognition (OCR) Engine
 * Powered by Tesseract.js with automated contrast enhancement preprocessing.
 */

import { createWorker } from 'tesseract.js';

let tesseractWorkerPromise = null;

async function getWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      try {
        const worker = await createWorker('eng');
        return worker;
      } catch (err) {
        console.warn('Failed to initialize Tesseract worker:', err);
        return null;
      }
    })();
  }
  return tesseractWorkerPromise;
}

/**
 * Preprocesses an image via canvas to enhance text contrast for sharper OCR recognition.
 * @param {File|Blob|string} imageInput 
 * @returns {Promise<string>} Enhanced image data URL or original source
 */
async function preprocessImage(imageInput) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get image data for grayscale & contrast enhancement
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            // Luminosity formula
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            // Moderate contrast stretch
            const contrastFactor = 1.15;
            const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrastFactor + 128));
            d[i] = enhanced;
            d[i + 1] = enhanced;
            d[i + 2] = enhanced;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput));
        }
      };

      img.onerror = () => {
        resolve(typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput));
      };

      if (typeof imageInput === 'string') {
        img.src = imageInput;
      } else if (imageInput instanceof Blob || imageInput instanceof File) {
        img.src = URL.createObjectURL(imageInput);
      } else {
        resolve('');
      }
    } catch {
      resolve('');
    }
  });
}

/**
 * Extracts visible readable text from a packaging image.
 * @param {File|Blob|string} imageSource 
 * @param {Function} [onProgress] Optional progress callback (progress: 0 to 1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(imageSource, onProgress = null) {
  if (!imageSource) {
    return { text: '', confidence: 0 };
  }

  try {
    const preprocessed = await preprocessImage(imageSource);
    const worker = await getWorker();

    if (!worker) {
      return { text: '', confidence: 0 };
    }

    const ret = await worker.recognize(preprocessed);
    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    // Clean whitespace and abnormal control characters
    const cleanText = rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return {
      text: cleanText,
      confidence: Math.round(confidence),
    };
  } catch (err) {
    console.warn('In-browser OCR processing error:', err);
    return { text: '', confidence: 0 };
  }
}
