/**
 * Imágenes de reportes — límites y conversión compartidos entre escritorio
 * y PWA (el backend los revalida). La conversión es LOCAL, sin red: la PWA
 * la usa antes de encolar las fotos (offline-first, spec §7c).
 */

/** Límites de imagen (los mismos del detalle — backend revalida). */
export const MAX_IMAGENES = 4;
export const MAX_TAMANO_IMAGEN = 10 * 1024 * 1024; // 10 MB (fotos de teléfono)

export interface ImagenConvertida {
  dataUrl: string;
  tamano: number;
  /**
   * MIME REAL del blob producido (menor 5 PR #23): navegadores sin encoder
   * WebP (algunos Safari) devuelven el PNG/JPEG del fallback — etiquetarlos
   * image/webp hacía que la firma del server rechazara el adjunto.
   */
  mime: string;
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
    // Reducción a 2048px de lado mayor: una foto de 12 MP comprimida a WebP
    // q0.85 pesa 1-3 MB; a 2048px queda en ~300-800 KB sin perder legibilidad
    // como evidencia (y así entra de sobra en el tope de 10 MB).
    const LADO_MAX = 2048;
    const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    if (!blob) return null;
    // Safari sin encoder WebP: toBlob cae al PNG (grande para fotos) —
    // re-codificar a JPEG (universal) y reportar el MIME REAL (menor 5 PR #23)
    if (blob.type !== 'image/webp') {
      const jpeg = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (!jpeg) return null;
      blob = jpeg;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error());
      reader.readAsDataURL(blob!);
    });
    return { dataUrl, tamano: blob.size, mime: blob.type };
  } catch {
    return null;
  }
}
