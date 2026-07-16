import { type StaticImageData } from "next/image";

export interface Producto {
  id: string;
  name: string;
  price: number;
  image: StaticImageData | string | Array<StaticImageData | string>; // Puede ser una o varias imágenes
  categoria: string;
  descripcion: string;
  modelo?: string;
  color?: string;
}
