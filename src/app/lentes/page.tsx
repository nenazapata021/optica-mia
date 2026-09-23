import Catalogo from "../catalogo/catalogo";
import { type Producto } from "../types/producto";
import { productosLentes } from "../data/productos.js";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lentes Formulados y Monturas en Itagüí y Medellín | Óptica Mía",
  description:
    "21 monturas para mujer, hombre y niños en Itagüí (452 Cra 49). Lentes monofocales, progresivos, fotocromáticos y filtro azul. Probador virtual IA y envío gratis 24-48h.",
  alternates: { canonical: "/lentes" },
  openGraph: { title: "Lentes Formulados | Óptica Mía Itagüí", description: "21 modelos con probador virtual IA desde $85.000 COP.", url: "/lentes", type: "website" },
};

function mapearLentes(): Producto[] {
  return productosLentes.map((p): Producto => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    imageSide: p.imageSide,
    categoria: p.categoria as "mujer" | "hombre" | "ninos",
    color: p.color,
    descripcion: "",
  }));
}

export default function LentesPage() {
  const misProductos: Producto[] = mapearLentes();

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-2">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 py-3">Inicio › Lentes</nav>
      </div>
      <Catalogo
        titulo="Lentes y Monturas — Medellín e Itagüí"
        descripcion="21 monturas con IVA incluido. Filtra por categoría y ordena por precio. Prueba con IA o compra directo."
        listaProductos={misProductos}
      />
    </>
  );
}