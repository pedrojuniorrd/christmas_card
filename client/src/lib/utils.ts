import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Otimiza URLs do Cloudinary automaticamente.
 * - q_auto: Ajusta a qualidade visualmente perfeita (reduz tamanho em ~70%)
 * - f_auto: Entrega WebP ou AVIF dependendo do navegador
 * - w_{width}: Redimensiona para a largura necessária
 */
export function optimizeImage(url: string | undefined | null, width = 800): string {
  if (!url) return "";
  
  // Se não for Cloudinary (ex: imagem local ou outro CDN), retorna original
  if (!url.includes("cloudinary.com")) return url;

  // Se a URL já tiver parâmetros de otimização, não mexe
  if (url.includes("q_auto")) return url;

  // A mágica: insere os parâmetros logo após "/upload/"
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}