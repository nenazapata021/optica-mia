import Catalogo from "../catalogo/catalogo";
import { productosLentes } from "../data/productos.js";
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

export default function LentesPage() {
  const misProductos: Producto[] = mapearLentes();

  return (
    <Catalogo
      titulo="Nuestra Colección de Lentes"
      descripcion="Descubre la montura perfecta para ti."
      listaProductos={misProductos}
    />
  );
}