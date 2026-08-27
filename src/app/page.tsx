import logoOriginalOpticaMia from "./assets/logos/Logo-optica-mia-original.jpg";
import Image from "next/image";
import Link from "next/link";
import Carousel from "./carousel/carousel";
import Catalogo from "./catalogo/catalogo";
import Servicios from "./servicios/servicios";
import ProcesoCompra from "./proceso compra/ProcesoCompra";
import Contacto from "./contacto/contacto";
import Testimonios from "./testimonios/Testimonios";
import { productosLentes, productosGafasSol } from "./data/productos.js";
import type { Producto } from "./types/producto";

export default function Home() {
  const productosDestacados: Producto[] = [
    ...productosLentes.map((p): Producto => ({
      id: p.id,
      name: p.nombre,
      price: p.precio,
      image: p.imagen,
      categoria: p.categoria as "mujer" | "hombre" | "ninos",
      color: p.color,
      descripcion: "",
    })),
    ...productosGafasSol.map((p): Producto => ({
      id: p.id,
      name: p.nombre,
      price: p.precio,
      image: p.imagen,
      categoria: p.categoria as "sol",
      color: p.color,
      descripcion: "",
    })),
  ];

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
                  src={logoOriginalOpticaMia}
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
          listaProductos={productosDestacados}
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