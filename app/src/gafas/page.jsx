import Catalogo from "@/components/catalogo";
import { productosGafasSol } from "@/data/productos";

export default function GafasPage() {
    return (
        <Catalogo
            titulo="Nuestra Colección de Sol"
            descripcion="Protección UV y estilo único."
            listaProductos={productosGafasSol}
        />
    );
}