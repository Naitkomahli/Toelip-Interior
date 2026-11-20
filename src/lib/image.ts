export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Foto gagal dibaca.'));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Foto gagal diproses.'))),
      type,
      quality
    );
  });
}

export async function processImage(file: File, maxEdge = 1400): Promise<ProcessedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Ukuran foto maksimal 15 MB.');
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser ini tidak mendukung pengolahan foto.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas, 'image/webp', 0.82);
  } catch {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.86);
  }

  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, width, height };
}
