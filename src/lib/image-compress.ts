/**
 * Client-side image compression utility.
 * Converts to JPEG, resizes to max 1600px width, strips EXIF, quality 0.75.
 */
export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

export async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.75,
  onProgress?: (pct: number) => void
): Promise<CompressResult> {
  onProgress?.(10);

  const bitmap = await createImageBitmap(file);
  onProgress?.(30);

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  onProgress?.(60);

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  onProgress?.(90);

  const baseName = file.name.replace(/\.[^.]+$/, '');
  onProgress?.(100);

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    fileName: `${baseName}.jpg`,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
