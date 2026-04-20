/**
 * Compresses an image data URL by drawing it to a canvas and exporting as JPEG with lower quality.
 * @param dataUrl The original base64/data URL image.
 * @param maxWidth The maximum width for the compressed image.
 * @param maxHeight The maximum height for the compressed image.
 * @param quality A number between 0 and 1 representing the JPEG quality.
 * @returns A promise that resolves to the compressed data URL.
 */
export async function compressImage(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}
