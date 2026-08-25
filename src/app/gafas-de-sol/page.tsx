import Catalogo from "../catalogo/catalogo";
import { productosGafasSol } from "../data/productos.js";
import type { Producto } from "../types/producto";

export default function GafasDeSolPage() {
  const misGafasDeSol: Producto[] = productosGafasSol.map((p) => ({
    id: p.id,
    name: p.nombre,
    price: p.precio,
    image: p.imagen,
    categoria: "sol",
    color: p.color,
    descripcion: "",
  }));

  return (
    <Catalogo
      titulo="Nuestra Colección de Gafas de Sol"
      descripcion="Protección con estilo. Descubre los mejores diseños para lucir bajo el sol."
      listaProductos={misGafasDeSol}
    />
  );
}
