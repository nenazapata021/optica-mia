import logoOriginalOpticaMia from "./assets/Logo-optica-mia-original.jpg";
import foto1SinFondo from './assets/FOTO1 Agatada. Referencia 8306.png';  
import foto2SinFondo from './assets/FOTO2-Agatada. Referencia 24028.png'; 
import foto3SinFondo from './assets/FOTO3-Vintage. Referencia 6019.png'; 
import foto4SinFondo from './assets/FOTO4-Ovalada. Referencia volt.png'; 
import foto5SinFondo from './assets/FOTO5-Agatada. Retro.png'; 
import foto6SinFondo from './assets/FOTO6-Agatada. Referencia retro.png'; 
import foto7SinFondo from './assets/FOTO7-Ágatada. Referencia retro.png';
import foto8SinFondo from './assets/FOTO8-Ovalada. Referencia Ser27.png';
import foto9SinFondo from './assets/FOTO9-Tres piezas. Referencia ctr8808.png';
import foto10SinFondo from './assets/FOTO10-Cuadrada. Ac086.png';
import foto11SinFondo from './assets/FOTO11-Cuadrada. Referencia Mir3206.png';
import foto12SinFondo from './assets/FOTO12-Cuadrada. Referencia 6516.png';
import foto13SinFondo from './assets/FOTO13-Ovalado. Referencia 6019.png';
import foto14SinFondo from './assets/FOTO14-Cuadrada. Referencia Dav5103.png';
import foto15SinFondo from './assets/FOTO15-Aviador. Referencia 82253.png';
import foto16SinFondo from './assets/FOTO16-Al aire. Referencia 6340.png';
import foto17SinFondo from './assets/FOTO17-Agatada. Referencia retro.png';
import foto18SinFondo from './assets/FOTO18-Cuadrada. Dav5107.png';
import foto19SinFondo from './assets/FOTO19-Cuadrada. Referencia boen.png';
import foto20SinFondo from './assets/FOTO20-Agatada. Referencia 81001.png';
import foto21SinFondo from './assets/FOTO21-Gafa de sol. Referencia Mia01.png';
import Image from "next/image";
import Link from "next/link";

import Carousel from "./carousel/carousel";
import Catalogo from "./catalogo/catalogo";
import Servicios from "./servicios/servicios";
import ProcesoCompra from "./proceso compra/ProcesoCompra";
import Contacto from "./contacto/contacto";
import Testimonios from "./testimonios/Testimonios";

const productosInicio = [
    { id: 'p1',  name: 'Agatada',                 reference: '8306',  price: 117000, image: foto1SinFondo,  categoria: 'mujer',  color: 'Vinotinto'},
    { id: 'p2',  name: 'Agatada',                 reference: '24028',  price: 117000, image: foto2SinFondo,  categoria: 'mujer',  color: 'marrón grisáceo'},
    { id: 'p3',  name: 'Vintage',                 reference: '6019',  price: 180000, image: foto3SinFondo,  categoria: 'mujer',  color: 'Dorado'},
    { id: 'p4',  name: 'Ovalada',                 reference: 'volt',  price: 110000, image: foto4SinFondo,  categoria: 'hombre', color: 'Dorado'},
    { id: 'p5',  name: 'Agatada',                 reference: 'Retro',  price:  124800, image: foto5SinFondo,  categoria: 'niños',  color: 'Nude-rosado'},
    { id: 'p6',  name: 'Agatada',                 reference: 'Retro',  price: 117000, image: foto6SinFondo,  categoria: 'sol',    color: 'Rojo-vino'},
    { id: 'p7',  name: 'Agatada',                 reference: 'Retro',  price: 117000, image: foto7SinFondo,  categoria: 'mujer',  color: 'Carey-tortoise'},
    { id: 'p8',  name: 'Ovalada',                 reference: 'Ser27',  price: 125000, image: foto8SinFondo,  categoria: 'hombre', color: 'Negro'},
    { id: 'p9',  name: 'Tres piezas',             reference: 'ctr8808',  price: 117000, image: foto9SinFondo,  categoria: 'sol',    color: 'Plateado'},
    { id: 'p10', name: 'Cuadrada',                reference: 'Ac086',  price:  135000, image: foto10SinFondo, categoria: 'niños',  color: 'Azul'},
    { id: 'p11', name: 'Cuadrada',                reference: 'Mir3206',  price: 125000, image: foto11SinFondo, categoria: 'mujer',  color: 'Cat-eyet/mariposa'},
    { id: 'p12', name: 'Cuadrada',                reference: '6516',  price: 89000, image: foto12SinFondo, categoria: 'hombre', color: 'Negro Mate'},
    { id: 'p13', name: 'Ovalado',                 reference: '6019',  price: 99000, image: foto13SinFondo, categoria: 'sol',    color: 'Plateado'},
    { id: 'p14', name: 'Cuadrada',                reference: 'Dav5103',  price: 133000, image: foto14SinFondo, categoria: 'mujer',  color: 'Negro'},
    { id: 'p15', name: 'Aviador',                 reference: '82253',  price: 125000, image: foto15SinFondo, categoria: 'hombre', color: 'Dorado'},
    { id: 'p16', name: 'Al aire',                 reference: '6340',  price: 155000, image: foto16SinFondo, categoria: 'sol',    color: 'Plateado'},
    { id: 'p17', name: 'Agatada',                 reference: 'Retro',  price:  125000, image: foto17SinFondo, categoria: 'niños',  color: 'Fucsia/rosa neon'},
    { id: 'p18', name: 'Cuadrada',                reference: 'Dav5107',  price: 133000, image: foto18SinFondo, categoria: 'mujer',  color: 'Negro'},
    { id: 'p19', name: 'Cuadrada',                reference: 'boen',  price: 110000, image: foto19SinFondo, categoria: 'hombre', color: 'Negro'},
    { id: 'p20', name: 'Agatada',                 reference: '81001',  price: 125000, image: foto20SinFondo, categoria: 'sol',    color: 'Dorado'},
    { id: 'p21', name: 'Gafas de sol',            reference: 'Mia01',  price: 55000, image: foto21SinFondo, categoria: 'hombre', color: 'gris'},
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