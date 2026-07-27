import logoOpticaMia from "./assets/optica-mia.jpg";
import foto1SinFondo from './assets/foto1-sin-fondo.png'; 
import foto1 from './assets/foto1.jpg'; 
import foto2 from './assets/foto2.jpg'; 
import foto3 from './assets/foto3.jpg'; 
import foto4 from './assets/foto4.jpg'; 
import foto5 from './assets/foto5.jpg'; 
import foto6 from './assets/foto6.jpg'; 
import foto7 from './assets/foto7.jpg';
import foto8 from './assets/foto8.jpg';
import foto9 from './assets/foto9.jpg';
import foto10 from './assets/foto10.jpg';
import foto11 from './assets/foto11.jpg';
import foto12 from './assets/foto12.jpg';
import foto13 from './assets/foto13.jpg';
import foto14 from './assets/foto14.jpg';
import foto15 from './assets/foto15.jpg';
import foto16 from './assets/foto16.jpg';
import foto17 from './assets/foto17.jpg';
import foto18 from './assets/foto18.jpg';
import foto19 from './assets/foto19.jpg';
import foto20 from './assets/foto20.jpg';
import foto21 from './assets/foto21.jpg';
import Image from "next/image";
import Link from "next/link";

import Carousel from "./carousel/carousel";
import Catalogo from "./catalogo/catalogo";
import Servicios from "./servicios/servicios";
import ProcesoCompra from "./proceso compra/ProcesoCompra";
import Contacto from "./contacto/contacto";
import Testimonios from "./testimonios/Testimonios";

const productosInicio = [
    { id: 'p22', name: 'Montura',         price: 120000, image: foto1SinFondo,  categoria: 'mujer',  color: 'Transparente', descripcion: '' },
    { id: 'p1',  name: 'Montura Clásica',         price: 120000, image: foto1,  categoria: 'mujer',  color: 'Transparente', descripcion: '' },
    { id: 'p2',  name: 'Montura Rosa',            price: 150000, image: foto2,  categoria: 'mujer',  color: 'Rosa',         descripcion: '' },
    { id: 'p3',  name: 'Montura Dorada',          price: 180000, image: foto3,  categoria: 'mujer',  color: 'Dorado',       descripcion: '' },
    { id: 'p4',  name: 'Montura Ejecutiva',       price: 175000, image: foto4,  categoria: 'hombre', color: 'Cobre',        descripcion: '' },
    { id: 'p5',  name: 'Montura Kids',            price:  95000, image: foto5,  categoria: 'niños',  color: 'Cobre',        descripcion: '' },
    { id: 'p6',  name: 'Gafas de Sol Aviador',    price: 210000, image: foto6,  categoria: 'sol',    color: 'Negro',        descripcion: '' },
    { id: 'p7',  name: 'Montura Carey',           price: 135000, image: foto7,  categoria: 'mujer',  color: 'Carey',        descripcion: '' },
    { id: 'p8',  name: 'Montura Metálica',        price: 190000, image: foto8,  categoria: 'hombre', color: 'Plateado',     descripcion: '' },
    { id: 'p9',  name: 'Gafas de Sol Polarizadas',price: 230000, image: foto9,  categoria: 'sol',    color: 'Negro',        descripcion: '' },
    { id: 'p10', name: 'Montura Infantil Azul',   price:  85000, image: foto10, categoria: 'niños',  color: 'Azul',         descripcion: '' },
    { id: 'p11', name: 'Montura Elegante',        price: 200000, image: foto11, categoria: 'mujer',  color: 'Dorado',       descripcion: '' },
    { id: 'p12', name: 'Montura Deportiva',       price: 160000, image: foto12, categoria: 'hombre', color: 'Rojo',         descripcion: '' },
    { id: 'p13', name: 'Gafas de Sol Vintage',    price: 195000, image: foto13, categoria: 'sol',    color: 'Miel',         descripcion: '' },
    { id: 'p14', name: 'Montura Gato',            price: 140000, image: foto14, categoria: 'mujer',  color: 'Negro',        descripcion: '' },
    { id: 'p15', name: 'Montura Rectangular',     price: 170000, image: foto15, categoria: 'hombre', color: 'Grafito',      descripcion: '' },
    { id: 'p16', name: 'Gafas de Sol Redondas',   price: 220000, image: foto16, categoria: 'sol',    color: 'Dorado',       descripcion: '' },
    { id: 'p17', name: 'Montura Infantil Rosa',   price:  90000, image: foto17, categoria: 'niños',  color: 'Rosa',         descripcion: '' },
    { id: 'p18', name: 'Montura Minimalista',     price: 155000, image: foto18, categoria: 'mujer',  color: 'Blanco',       descripcion: '' },
    { id: 'p19', name: 'Montura Clubmaster',      price: 185000, image: foto19, categoria: 'hombre', color: 'Carey',        descripcion: '' },
    { id: 'p20', name: 'Gafas de Sol Deportivas', price: 240000, image: foto20, categoria: 'sol',    color: 'Azul',         descripcion: '' },
    { id: 'p21', name: 'Montura Aviador',         price: 210000, image: foto21, categoria: 'hombre', color: 'Plateado',     descripcion: '' },
  ];

export default function Home() {
   return (

      <div className="w-full flex flex-col items-center">
      {/* Nuevo Hero Section */}
      <section className="w-full [bg-gradient-to-r] from-white to-gray-100 py-16 md:py-24 flex items-center justify-center min-h-[calc(100vh-92px)]">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Columna Izquierda: Título, Eslogan y Botones */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#005f6b]">
              Óptica Mia
            </h1>
            <p className="mt-4 text-xl text-gray-700 font-medium">
              Tu visión, nuestra prioridad. Encuentra gafas con estilo sin salir de casa.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href="#productos"
                className="rounded-full border-2 border-[#008294] px-8 py-3 font-bold text-[#008294] transition-transform duration-300 hover:scale-105 hover:bg-[#008294] hover:text-white shadow-lg"
              >
                Ver colección
              </a>
              <a
                href="https://wa.me/573017391219"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[#008294] px-8 py-3 font-bold text-[#008294] transition-transform duration-300 hover:scale-105 hover:bg-[#008294] hover:text-white shadow-lg"
              >
                Agendar examen
              </a>
              <Link
                href="/ubicacion"
                className="rounded-full border-2 border-[#008294] px-8 py-3 font-bold text-[#008294] transition-transform duration-300 hover:scale-105 hover:bg-[#008294] hover:text-white shadow-lg"
              >
                Ver ubicación
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta con Logo */}
          <div className="flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 flex items-center justify-center w-64 h-64 md:w-80 md:h-80 transition-transform duration-300 hover:scale-105">
              <Image
                  src={logoOpticaMia}
                  alt="Logo Óptica Mia"
                  width={250}
                  height={250}
                  priority
                  className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Carousel */}
      <div className="py-12 w-full bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <Carousel />
        </div>
      </div>

      {/* Proceso de Compra */}
      <div className="py-4 w-full">
        <ProcesoCompra />
      </div>

      {/* Grid de Productos Destacados */}
      <div id="productos">
        <Catalogo 
          titulo="Modelos Destacados"
          descripcion="Nuestra selección exclusiva para ti hoy."
          listaProductos={productosInicio} 
        />
      </div>

      {/* Servicios */}
      <div className="py-4 w-full">
        <Servicios />
      </div>

      {/* Testominios */}
      <div className="py-4 w-full">
        <Testimonios />
      </div>

      {/* Contacto */}
      <div id="contacto" className="py-4 w-full">
        <Contacto />
      </div>
    </div>
   );
}