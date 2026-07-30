import { type StaticImageData } from "next/image";

export interface Producto {
  id: string;
  name: string;
  price: number;
  image: StaticImageData | string | Array<StaticImageData | string>;
  categoria: string;
  descripcion: string;
  modelo?: string;
  color?: string;
  imagenMontura?: StaticImageData | string;
}
