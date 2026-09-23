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
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e0f2f4] px-3 py-1 text-xs font-semibold text-[#005f6b] mb-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden /> Solo Medellín e Itagüí • Envío gratis 24-48h
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-[#005f6b]">
              Óptica Mía
              <span className="block text-2xl md:text-3xl font-bold text-[#008294] mt-1">452 Cra. 49 — Itagüí</span>
            </h1>
            <p className="mt-3 text-lg md:text-xl text-gray-700 font-medium">
              Prueba tus gafas con <span className="font-bold text-[#008294]">IA en tu rostro</span> antes de comprar. Luego elige lentes formulados.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/probador-landing"
                className="rounded-full bg-[#008294] px-8 py-3.5 font-bold text-white shadow-lg hover:bg-[#005f6b] hover:scale-[1.02] transition flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] focus-visible:ring-offset-2"
              >
                ✨ Probar con IA — Gratis
              </Link>
              <a
                href="#productos"
                className="rounded-full border-2 border-[#008294] px-8 py-3.5 font-bold text-[#008294] hover:bg-[#e0f2f4] transition flex items-center justify-center min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294]"
              >
                Ver colección
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <a href="https://wa.me/573017391219" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#008294] underline hover:text-[#005f6b] min-h-[44px] inline-flex items-center px-2">Agendar examen →</a>
              <span className="text-gray-300 hidden sm:inline self-center">|</span>
              <Link href="/ubicacion" className="text-sm font-medium text-[#008294] underline hover:text-[#005f6b] min-h-[44px] inline-flex items-center px-2">Cómo llegar a Cra 49</Link>
            </div>
            <div className="mt-4 flex items-center gap-3 justify-center md:justify-start text-xs text-gray-500">
              <span className="flex items-center gap-1">✓ Wompi seguro</span>
              <span className="flex items-center gap-1">✓ 4.8★ Google</span>
              <span className="flex items-center gap-1">✓ Garantía</span>
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
      {/* Trust bar */}
      <div className="w-full bg-white border-y border-gray-100 py-3">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap justify-center md:justify-between gap-4 text-sm">
          <span className="flex items-center gap-2"><span className="text-green-600">✓</span> Solo Medellín e Itagüí — entrega 24-48h</span>
          <span className="flex items-center gap-2"><span className="text-green-600">✓</span> Precios con IVA • Financia con Addi/Sistecredito</span>
          <span className="flex items-center gap-2"><span className="text-green-600">✓</span> Garantía y devoluciones 15 días</span>
        </div>
      </div>
      {/* Carousel con CTA */}
      <div className="py-10 w-full bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Explora Nuestra Colección</h2>
            <Link href="/lentes" className="text-sm font-semibold text-[#008294] hover:underline min-h-[44px] inline-flex items-center">Ver todo →</Link>
          </div>
          <Carousel />
          <p className="text-center text-xs text-gray-400 mt-3">Desliza o usa flechas • Toca una montura para probar con IA</p>
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
          headingAs="h2"
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