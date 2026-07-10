"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Importación de imágenes locales
import foto1 from '../assets/foto1.jpg';
import foto2 from '../assets/foto2.jpg';
import foto3 from '../assets/foto3.jpg';
import foto4 from '../assets/foto4.jpg';
import foto5 from '../assets/foto5.jpg';
import foto6 from '../assets/foto6.jpg';

// Base de datos local inyectada directamente para evitar fallas de rutas relativas
const todosProd = [
  { id: 'p1', nombre: 'Montura Clásica', precio: 120000, imagen: foto1, categoria: 'mujer', color: 'Transparente' },
  { id: 'p2', nombre: 'Montura Rosa', precio: 150000, imagen: foto2, categoria: 'mujer', color: 'Rosa' },
  { id: 'p3', nombre: 'Montura Dorada', precio: 180000, imagen: foto3, categoria: 'mujer', color: 'Dorado' },
  { id: 'p4', nombre: 'Montura Ejecutiva', precio: 175000, imagen: foto4, categoria: 'hombre', color: 'Cobre' },
  { id: 'p5', nombre: 'Montura Kids', precio: 95000, imagen: foto5, categoria: 'niños', color: 'Cobre' },
  { id: 'p6', nombre: 'Gafas de Sol Aviador', precio: 210000, imagen: foto6, categoria: 'sol', color: 'Negro' },
];

export default function ProbadorLanding() {
  const router = useRouter();
  const [categoriaSel, setCategoriaSel] = useState("todos");

  const filtrados = todosProd.filter((p) => {
    if (categoriaSel === "todos") return true;
    return p.categoria === categoriaSel;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">Catálogo Probador Virtual</h1>
        <p className="text-gray-600 max-w-xl mx-auto">Selecciona la montura que más te guste y mírala en tu rostro al instante usando IA.</p>
        
        {/* Filtros */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {["todos", "mujer", "hombre", "niños", "sol"].map((cat) => (
            <button key={cat} onClick={() => setCategoriaSel(cat)} className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition ${categoriaSel === cat ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`} style={categoriaSel === cat ? { backgroundColor: "#008294" } : {}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtrados.map((producto) => (
          <div key={producto.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center h-48 mb-4">
              <image src={producto.imagen} alt={producto.nombre} className="max-h-36 object-contain mix-blend-multiply" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base mb-1 truncate">{producto.nombre}</h3>
              <p className="text-sm font-bold text-[#008294] mb-4">${producto.precio.toLocaleString("es-CO")}</p>
              <button 
                onClick={() => router.push(`/probador?productoId=${producto.id}`)} 
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition" style={{ backgroundColor: "#008294" }}
              >
                🕶️ Probar Virtualmente
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}