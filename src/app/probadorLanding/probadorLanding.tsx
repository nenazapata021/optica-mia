"use client";

import React, { useState } from "react";
import Image from "next/image"; 
import { type Producto } from "../types/producto";
import ModalProbador from "../modal probador/modalProbador";

// Importación de imágenes locales
import foto1 from '../assets/foto1.jpg';
import foto2 from '../assets/foto2.jpg';
import foto3 from '../assets/foto3.jpg';
import foto4 from '../assets/foto4.jpg';
import foto5 from '../assets/foto5.jpg';
import foto6 from '../assets/foto6.jpg';

// Base de datos local
const todosProd: Producto[] = [
  { id: 'p1', name: 'Montura Clásica', price: 120000, image: foto1, categoria: 'mujer', color: 'Transparente', descripcion: 'Una montura clásica y elegante.' },
  { id: 'p2', name: 'Montura Rosa', price: 150000, image: foto2, categoria: 'mujer', color: 'Rosa', descripcion: 'Un toque de color para tu estilo.' },
  { id: 'p3', name: 'Montura Dorada', price: 180000, image: foto3, categoria: 'mujer', color: 'Dorado', descripcion: 'Lujo y sofisticación.' },
  { id: 'p4', name: 'Montura Ejecutiva', price: 175000, image: foto4, categoria: 'hombre', color: 'Cobre', descripcion: 'Profesionalismo y modernidad.' },
  { id: 'p5', name: 'Montura Kids', price: 95000, image: foto5, categoria: 'niños', color: 'Cobre', descripcion: 'Resistentes y divertidas para los más pequeños.' },
  { id: 'p6', name: 'Gafas de Sol Aviador', price: 210000, image: foto6, categoria: 'sol', color: 'Negro', descripcion: 'Un clásico que nunca pasa de moda.' },
];

export default function ProbadorLanding() {
  const [categoriaSel, setCategoriaSel] = useState("todos");
  const [productoParaProbar, setProductoParaProbar] = useState<Producto | null>(null);

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