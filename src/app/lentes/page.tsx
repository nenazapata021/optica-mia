import Catalogo from "../catalogo/catalogo";
import { type Producto } from "../types/producto";
import { productosLentes } from "../data/productos.js";

function mapearLentes(): Producto[] {
  return productosLentes.map((p): Producto => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    categoria: p.categoria as "mujer" | "hombre" | "ninos",
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