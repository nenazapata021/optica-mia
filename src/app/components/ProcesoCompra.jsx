"use client";

import { Glasses, FileText, Truck } from "lucide-react";

const pasos = [
  {
    icono: <Glasses size={40} className="text-white" />,
    titulo: "1. Elige tu montura",
    descripcion:
      "Explora nuestro catálogo y encuentra el estilo que te define.",
  },
  {
    icono: <FileText size={40} className="text-white" />,
    titulo: "2. Envía tu fórmula",
    descripcion:
      "Nos envías tu fórmula o programas tu cita de optometría con nosotros.",
  },
  {
    icono: <Truck size={40} className="text-white" />,
    titulo: "3. Recibe en casa",
    descripcion:
      "Preparamos tus gafas con precisión y te las enviamos a la puerta de tu casa. ¡Así de fácil!",
  },
];

export default function ProcesoCompra() {
  return (
    <section className="w-full bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-[#005f6b]">
            Tu Visión en 3 Simples Pasos
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Comprar tus nuevas gafas nunca fue tan sencillo.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {pasos.map((paso, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-8 rounded-2xl bg-[#008294] text-white shadow-xl transform transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#C39C4E]/80">
                {paso.icono}
              </div>
              <h3 className="mb-2 text-2xl font-bold">{paso.titulo}</h3>
              <p className="text-blue-50/90">{paso.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}