/**
 * Client-side Image Compressor Utility
 * Automatically downsamples and compresses heavy mobile camera photos (e.g. 15MB-30MB)
 * down to ~250KB before uploading to backend, preventing network timeouts, payload size
 * limit errors, and connection drops on mobile devices while maintaining AI visual clarity.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  const fileName = (file.name || '').toLowerCase();
  const isImageMime = file.type.startsWith('image/');
  const isImageExt = /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(fileName);

  // Return immediately if not an image
  if (!isImageMime && !isImageExt) {
    return file;
  }

  const isHeic = file.type.includes('heic') || file.type.includes('heif') || fileName.endsWith('.heic') || fileName.endsWith('.heif');
  
  // If already under 350KB and standard JPEG/PNG/WebP, keep it
  if (!isHeic && file.size < 350 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    return file;
  }

  // Try modern createImageBitmap first (fast & respects EXIF orientation)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window && !isHeic) {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
        if (blob && blob.size > 0) {
          return new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }
          );
        }
      }
    } catch {
      // Fallback to FileReader below
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
