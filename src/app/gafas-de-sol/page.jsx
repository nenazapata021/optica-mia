import Catalogo from "../components/catalogo";
import gafasDeSol1 from "../assets/gafas de sol1.jpg";
import gafasDeSol2 from "../assets/gafas de sol2.jpg";
import gafasDeSol3 from "../assets/gafas de sol3.jpg";
import gafasDeSol4 from "../assets/gafas de sol4.jpg";
import gafasDeSol5 from "../assets/gafas de sol5.jpg";
import gafasDeSol6 from "../assets/gafas de sol6.jpg";

export default function GafasDeSolPage() {
  const misGafasDeSol = [
    { id: 1, imagen: gafasDeSol1, nombre: "Gafas de Sol Aviador", precio: 150000, categoria: "sol", color: "Negro" },
    { id: 2, imagen: gafasDeSol2, nombre: "Gafas de Sol Retro", precio: 135000, categoria: "sol", color: "Carey" },
    { id: 3, imagen: gafasDeSol3, nombre: "Gafas de Sol Cateye Slim", precio: 160000, categoria: "sol", color: "Negro" },
    { id: 4, imagen: gafasDeSol4, nombre: "Gafas de Sol Deportivas", precio: 145000, categoria: "sol", color: "Azul" },
    { id: 5, imagen: gafasDeSol5, nombre: "Gafas de Sol Urbanas", precio: 120000, categoria: "sol", color: "Plata" },
    { id: 6, imagen: gafasDeSol6, nombre: "Gafas de Sol Classic", precio: 130000, categoria: "sol", color: "Dorado" },
  ];

  return (
    <Catalogo 
      titulo="Nuestra Colección de Gafas de Sol"
      descripcion="Protección con estilo. Descubre los mejores diseños para lucir bajo el sol."
      listaProductos={misGafasDeSol} 
    />
  );
}