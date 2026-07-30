import Catalogo from "../catalogo/catalogo";
import { productosLentes, productosGafasSol } from "../data/productos.js";
import type { Producto } from "../types/producto";

function mapearLentes(): Producto[] {
  return productosLentes.map((p) => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    categoria: "lentes",
    color: p.color,
    descripcion: "",
  }));
}

function mapearGafasSol(): Producto[] {
  return productosGafasSol.map((p) => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    categoria: "sol",
    color: p.color,
    descripcion: "",
  }));
}

export default function LentesPage() {
  const misProductos: Producto[] = [...mapearLentes(), ...mapearGafasSol()];

  return (
    <Catalogo
      titulo="Nuestra Colección de Lentes y Gafas de Sol"
      descripcion="Descubre la montura o gafa perfecta para ti."
      listaProductos={misProductos}
    />
  );
}