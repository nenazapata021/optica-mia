"use client";

import logoOpticaMia from "./assets/optica-mia.jpg";
import foto1 from './assets/foto1.jpg'; 
import foto2 from './assets/foto2.jpg'; 
import foto3 from './assets/foto3.jpg'; 
import foto4 from './assets/foto4.jpg'; 
import foto5 from './assets/foto5.jpg'; 
import foto6 from './assets/foto6.jpg'; 
import Image from "next/image";

import Carousel from "./components/carousel";
import Catalogo from "./components/catalogo";
import Servicios from "./components/servicios";
import ProcesoCompra from "./components/ProcesoCompra";
import Contacto from "./components/contacto";
import Testimonios from "./components/Testimonios";

const productosInicio = [
    { id: 'p1', nombre: 'Montura Clásica', precio: 120000, imagen: foto1, categoria: 'mujer', color: 'Transparente' },
    { id: 'p2', nombre: 'Montura Rosa', precio: 150000, imagen: foto2, categoria: 'mujer', color: 'Rosa' },
    { id: 'p3', nombre: 'Montura Dorada', precio: 180000, imagen: foto3, categoria: 'mujer', color: 'Dorado' },
    { id: 'p4', nombre: 'Montura Ejecutiva', precio: 175000, imagen: foto4, categoria: 'hombre', color: 'Cobre' },
    { id: 'p5', nombre: 'Montura Kids', precio: 95000, imagen: foto5, categoria: 'niños', color: 'Cobre' },
    { id: 'p6', nombre: 'Gafas de Sol Aviador', precio: 210000, imagen: foto6, categoria: 'sol', color: 'Negro' },
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
              Tú visión, nuestra prioridad. Encuentra gafas con estilo sin salir de casa.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href="#productos" // Anchor to the products section
                className="rounded-full bg-[#008294] px-8 py-3 font-bold text-white transition hover:bg-[#006d7a] shadow-lg"
              >
                Ver colección
              </a>
              <a
                href="#contacto" // Anchor to the contact section
                className="rounded-full border-2 border-[#008294] px-8 py-3 font-bold text-[#008294] transition hover:bg-[#008294] hover:text-white shadow-lg"
              >
                Agendar examen
              </a>
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
      <Catalogo 
        titulo="Modelos Destacados"
        descripcion="Nuestra selección exclusiva para ti hoy."
        listaProductos={productosInicio} 
        />

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