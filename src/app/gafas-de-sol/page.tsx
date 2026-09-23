import Catalogo from "../catalogo/catalogo";
import { productosGafasSol } from "../data/productos.js";
import type { Producto } from "../types/producto";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gafas de Sol en Medellín e Itagüí | Óptica Mía",
  description:
    "7 modelos de gafas de sol aviador, retro y deportivas desde $120.000 COP. Protección UV, probador virtual IA y envío gratis Medellín/Itagüí.",
  alternates: { canonical: "/gafas-de-sol" },
  openGraph: { title: "Gafas de Sol | Óptica Mía Itagüí", description: "Gafas aviador, cateye y deportivas con estilo.", url: "/gafas-de-sol", type: "website" },
};

export default function GafasDeSolPage() {
  const misGafasDeSol: Producto[] = productosGafasSol.map((p) => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    imageSide: p.imageSide,
    categoria: "sol",
    color: p.color,
    descripcion: "",
  }));

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-2">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 py-3">Inicio › Gafas de Sol</nav>
      </div>
      <Catalogo
        titulo="Gafas de Sol — Medellín e Itagüí"
        descripcion="Protección UV con estilo. 7 diseños con IVA incluido y probador virtual IA."
        listaProductos={misGafasDeSol}
      />
    </>
  );
}
