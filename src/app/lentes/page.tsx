import Catalogo from "../catalogo/catalogo"; 
import foto1 from "../assets/foto1.jpg";
import foto2 from "../assets/foto2.jpg";
import foto3 from "../assets/foto3.jpg";
import foto4 from "../assets/foto4.jpg";
import foto5 from "../assets/foto5.jpg";
import foto6 from "../assets/foto6.jpg";

export default function LentesPage() {
  const misProductos = [
    { id: "1", image: foto1, name: "Montura Clásica", price: 120000, categoria: "mujer", color: "Plata", descripcion: "" },
    { id: "2", image: foto2, name: "Montura Moderna Slim", price: 120000, categoria: "mujer", color: "Plata", descripcion: "" },
    { id: "3", image: foto3, name: "Montura Aviador Rectangular", price: 120000, categoria: "hombre", color: "Negro", descripcion: "" },
    { id: "4", image: foto4, name: "Montura Retro", price: 135000, categoria: "sol", color: "Negro", descripcion: "" },
    { id: "5", image: foto5, name: "Montura Junior", price: 95000, categoria: "niños", color: "Azul", descripcion: "" },
    { id: "6", image: foto6, name: "Montura Cateye", price: 150000, categoria: "mujer", color: "Carey", descripcion: "" },
  ];

  return (
    <Catalogo 
      titulo="Nuestra Colección de Lentes"
      descripcion="Descubre la montura perfecta para tus lentes formulados."
      listaProductos={misProductos} 
    />
  );
}