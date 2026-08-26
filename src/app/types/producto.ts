import { type StaticImageData } from "next/image";

export type ImageAngle =
  | "FRONTAL"
  | "LATERAL_DERECHO"
  | "LATERAL_IZQUIERDO"
  | "TRES_CUARTOS"
  | "DETALLE";

export interface ProductImageDTO {
  url: string | StaticImageData;
  angle: ImageAngle;
  alt: string;
  sortOrder: number;
}

export interface Producto {
  id: string;
  name: string;
  reference?: string;
  price: number;
  /** @deprecated mantener para compatibilidad legacy; usar `images` */
  image: StaticImageData | string | Array<StaticImageData | string>;
  /** Array normalizado 4-5 imágenes con ángulo/alt. Fallback a `image` si vacío. Opcional para compat legacy. */
  images?: ProductImageDTO[];
  categoria: "mujer" | "hombre" | "ninos" | "sol";
  descripcion?: string;
  modelo?: string;
  color?: string;
  imagenMontura?: StaticImageData | string;
  tags?: string[];
  material?: string;
  warranty?: string;
  /** Ajuste fino de tamaño de la montura en el probador (multiplicador sobre FRAME_SCALE_FACTOR). */
  scaleMultiplier?: number;
}
