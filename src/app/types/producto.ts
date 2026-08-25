import { type StaticImageData } from "next/image";

export interface Producto {
  id: string;
  name: string;
  reference?: string;
  price: number;
  image: StaticImageData | string | Array<StaticImageData | string>;
  categoria: "mujer" | "hombre" | "ninos" | "sol";
  descripcion?: string;
  modelo?: string;
  color?: string;
  imagenMontura?: StaticImageData | string;
  /** Ajuste fino de tamaño de la montura en el probador (multiplicador sobre FRAME_SCALE_FACTOR). */
  scaleMultiplier?: number;
}
