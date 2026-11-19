/**
 * Imágenes de reportes — límites y conversión compartidos entre escritorio
 * y PWA (el backend los revalida). La conversión es LOCAL, sin red: la PWA
 * la usa antes de encolar las fotos (offline-first, spec §7c).
 */

/** Límites de imagen (los mismos del detalle — backend revalida). */
export const MAX_IMAGENES = 4;
export const MAX_TAMANO_IMAGEN = 2 * 1024 * 1024; // 2 MB

export interface ImagenConvertida {
  dataUrl: string;
  tamano: number;
}

/**
 * Convierte cualquier imagen (image/*) a WebP con canvas (calidad 0.85) para
 * que pesen menos. Devuelve el data URI WebP + su tamaño, o null si el navegador
 * no pudo decodificar/convertir (formato ajeno al canvas, p.ej. HEIC viejo).
 */
export async function convertirAWebp(file: File): Promise<ImagenConvertida | null> {
  try {
    const dataUrlSrc = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error());
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error());
      image.src = dataUrlSrc;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    if (!blob) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error());
      reader.readAsDataURL(blob);
    });
    return { dataUrl, tamano: blob.size };
  } catch {
    return null;
  }
}
