import { type StaticImageData } from "next/image";
import { type ProductImageDTO, type Producto } from "../types/producto";

function toStringUrl(value: string | StaticImageData): string {
  return typeof value === "string" ? value : value.src;
}

function getAngleLabel(angle: ProductImageDTO["angle"]): string {
  const labels: Record<ProductImageDTO["angle"], string> = {
    FRONTAL: "Vista frontal",
    LATERAL_DERECHO: "Perfil derecho",
    LATERAL_IZQUIERDO: "Perfil izquierdo",
    TRES_CUARTOS: "Vista 3/4",
    DETALLE: "Detalle bisagra",
  };
  return labels[angle] ?? angle;
}

/**
 * Normaliza cualquier shape legacy (image string | array | Producto con images)
 * a un array de ProductImageDTO ordenado por sortOrder.
 * Garantiza al menos 1 imagen (fallback a image).
 */
export function normalizeProductImages(producto: Partial<Producto> & { image?: unknown; images?: unknown }): ProductImageDTO[] {
  // Caso nuevo: images ya es ProductImageDTO[]
  if (Array.isArray(producto.images) && producto.images.length > 0) {
    const first = producto.images[0] as unknown;
    // Detecta si son DTOs (tienen url+angle)
    if (first && typeof first === "object" && "url" in (first as Record<string, unknown>)) {
      return (producto.images as ProductImageDTO[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    }
    // Caso legacy: images es string[] | StaticImageData[]
    const legacyImages = producto.images as unknown as Array<string | StaticImageData>;
    const angles: ProductImageDTO["angle"][] = ["FRONTAL", "LATERAL_DERECHO", "LATERAL_IZQUIERDO", "TRES_CUARTOS", "DETALLE"];
    return legacyImages.map((img, i) => ({
      url: img,
      angle: angles[i] ?? "FRONTAL",
      alt: `${producto.name ?? "Producto"} - ${getAngleLabel(angles[i] ?? "FRONTAL")}`,
      sortOrder: i,
    }));
  }

  // Fallback a image singular o array legacy image
  const imgField = producto.image;
  if (Array.isArray(imgField) && imgField.length > 0) {
    const angles: ProductImageDTO["angle"][] = ["FRONTAL", "LATERAL_DERECHO", "LATERAL_IZQUIERDO", "TRES_CUARTOS", "DETALLE"];
    return (imgField as Array<string | StaticImageData>).map((img, i) => ({
      url: img,
      angle: angles[i] ?? "FRONTAL",
      alt: `${producto.name ?? "Producto"} - ${getAngleLabel(angles[i] ?? "FRONTAL")}`,
      sortOrder: i,
    }));
  }
  if (imgField) {
    const url = imgField as string | StaticImageData;
    return [{ url, angle: "FRONTAL", alt: `${producto.name ?? "Producto"} - Vista frontal`, sortOrder: 0 }];
  }

  return [];
}

export function getProductImageUrls(producto: Partial<Producto>): string[] {
  return normalizeProductImages(producto).map((img) => toStringUrl(img.url as string | StaticImageData));
}

export function getMainImageUrl(producto: Partial<Producto>): string | StaticImageData | null {
  const normalized = normalizeProductImages(producto);
  return normalized.length > 0 ? normalized[0].url : null;
}
