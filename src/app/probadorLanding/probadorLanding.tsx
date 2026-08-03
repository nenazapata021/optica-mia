"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image"; 
import { type Producto } from "../types/producto";
import ModalProbador from "../modal probador/modalProbador";

// Importación de imágenes locales
import foto1 from '../assets/foto1-sin-fondo.png';
import foto2 from '../assets/foto2-sin-fondo.png';
import foto3 from '../assets/foto3-sin-fondo.png';
import foto4 from '../assets/foto4-sin-fondo.png';
import foto5 from '../assets/foto5-sin-fondo.png';
import foto6 from '../assets/foto6-sin-fondo.png';
import foto7 from '../assets/foto7-sin-fondo.png';
import foto8 from '../assets/foto8-sin-fondo.png';
import foto9 from '../assets/foto9-sin-fondo.png';
import foto10 from '../assets/foto10-sin-fondo.png';
import foto11 from '../assets/foto11-sin-fondo.png';
import foto12 from '../assets/foto12-sin-fondo.png';
import foto13 from '../assets/foto13-sin-fondo.png';
import foto14 from '../assets/foto14-sin-fondo.png';
import foto15 from '../assets/foto15-sin-fondo.png';
import foto16 from '../assets/foto16-sin-fondo.png';
import foto17 from '../assets/foto17-sin-fondo.png';
import foto18 from '../assets/foto18-sin-fondo.png';
import foto19 from '../assets/foto19-sin-fondo.png';
import foto20 from '../assets/foto20-sin-fondo.png';
import foto21 from '../assets/foto21-sin-fondo.png';

const todosProd: Producto[] = [
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

export default function ProbadorLanding() {
  const [categoriaSel, setCategoriaSel] = useState("todos");
  const [productoParaProbar, setProductoParaProbar] = useState<Producto | null>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    const guardado = localStorage.getItem("optica-mia-filtro-categoria");
    if (guardado && categorias.includes(guardado)) {
      setCategoriaSel(guardado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    localStorage.setItem("optica-mia-filtro-categoria", categoriaSel);
  }, [categoriaSel]);

  const filtrados = todosProd.filter((p) => {
    if (categoriaSel === "todos") return true;
    return p.categoria === categoriaSel;
  });

  // Derivamos las categorías dinámicamente de los productos
  const categorias = ["todos", ...Array.from(new Set(todosProd.map(p => p.categoria)))];

  const getButtonClass = (cat: string) =>
    categoriaSel === cat
      ? "px-5 py-2 text-sm font-semibold rounded-full capitalize transition text-white"
      : "px-5 py-2 text-sm font-medium rounded-full capitalize transition hover:opacity-80";

  const getButtonStyle = (cat: string) =>
    categoriaSel === cat
      ? { backgroundColor: "#008294", color: "#fff" }
      : { backgroundColor: "#e0f2f4", color: "#005f6b" };

  return (
    <>
      {productoParaProbar && (
        <ModalProbador
          producto={productoParaProbar}
          onClose={() => setProductoParaProbar(null)}
          listaMonturas={filtrados}
        />
      )}
      <div className="w-full min-h-screen bg-[#e2f1ee] py-10 px-4">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Catálogo Probador Virtual</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Selecciona la montura que más te guste y mírala en tu rostro al instante usando IA.</p>
          
          {/* Filtros estilizados idénticos */}
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            {categorias.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSel(cat)} 
                className={getButtonClass(cat)} 
                style={getButtonStyle(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Título de indicador de cantidad */}
        <div className="max-w-6xl mx-auto mb-6">
          <h2 className="text-2xl font-bold capitalize text-left text-gray-800 flex items-center gap-1">
            {categoriaSel}{" "}
            <span className="text-gray-500 text-lg font-normal">
              ({filtrados.length})
            </span>
          </h2>
        </div>

        {/* Grid de productos ajustado a 3 columnas */}
        <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((producto) => (
            <div key={producto.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              
              {/* Contenedor de Imagen adaptado con Next.js Image Component */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden mb-4 bg-gray-50 flex items-center justify-center">
                <Image 
                  src={Array.isArray(producto.image) ? producto.image[0] : producto.image} 
                  alt={producto.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-4 mix-blend-multiply" 
                />
              </div>

              <div className="flex flex-col [flex-grow]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-bold text-gray-800 truncate">
                    {producto.name}
                  </span>
                  <strong className="text-lg font-bold text-[#008294]">
                    ${producto.price.toLocaleString("es-CO")}
                  </strong>
                </div>

                {/* Detalles secundarios en gris */}
                <div className="flex justify-between items-center text-sm text-gray-400 capitalize mb-5">
                  <span>{producto.categoria}</span>
                  {producto.color && <span>{producto.color}</span>}
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => setProductoParaProbar(producto)} 
                    className="w-full py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#008294" }}
                  >
                    🕶️ Probar Virtualmente
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </>
  );
}