import Catalogo from "../components/catalogo"; 
import foto1 from "../assets/foto1.jpg";
import foto2 from "../assets/foto2.jpg";
import foto3 from "../assets/foto3.jpg";
import foto4 from "../assets/foto4.jpg";
import foto5 from "../assets/foto5.jpg";
import foto6 from "../assets/foto6.jpg";

export default function LentesPage() {
  const misProductos = [
    { id: 1, imagen: foto1, nombre: "Montura Clásica", precio: 120000, categoria: "mujer", color: "Plata" },
    { id: 2, imagen: foto2, nombre: "Montura Moderna Slim", precio: 120000, categoria: "mujer", color: "Plata" },
    { id: 3, imagen: foto3, nombre: "Montura Aviador Rectangular", precio: 120000, categoria: "hombre", color: "Negro" },
    { id: 4, imagen: foto4, nombre: "Montura Retro", precio: 135000, categoria: "sol", color: "Negro" },
    { id: 5, imagen: foto5, nombre: "Montura Junior", precio: 95000, categoria: "niños", color: "Azul" },
    { id: 6, imagen: foto6, nombre: "Montura Cateye", precio: 150000, categoria: "mujer", color: "Carey" },
  ];

  return (
    <Catalogo 
      titulo="Nuestra Colección de Lentes"
      descripcion="Descubre la montura perfecta para tus lentes formulados."
      listaProductos={misProductos} 
    />
  );
}