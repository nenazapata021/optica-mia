"use client";

import Image from "next/image";

// Importamos las imágenes para los avatares de los testimonios
import avatar1 from "../assets/Pantallazo 1.png";
import avatar2 from "../assets/Pantallazo 2.png";
import avatar3 from "../assets/Pantallazo 3.png";

// Datos de ejemplo para los testimonios. Puedes reemplazarlos con los tuyos.
const testimonios = [
  {
    id: 1,
    avatar: avatar1,
  },
  {
    id: 2,
    avatar: avatar2,
  },
  {
    id: 3,
    avatar: avatar3,
  },
];

export default function Testimonios() {
  return (
    <section id="testimonios" className="w-full bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-[#005f6b]">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Opiniones reales de personas que ya disfrutan su nueva visión.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonios.map((item) => (
            <article
              key={item.id}
              className="group relative block overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:-translate-y-2"
            >
              <Image
                src={item.avatar}
                alt={`Testimonio de cliente ${item.id}`}
                placeholder="blur"
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}