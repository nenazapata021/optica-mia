"use client";

import logoNequi from '../assets/logo de nequi.jpg';
import logoAddi from '../assets/logo de Addi.jpg';
import logoSistecredito from '../assets/logo de sistecredito.png';
import Image, { type StaticImageData } from 'next/image';

interface ServicioItemLogo {
  texto: string;
  logo: StaticImageData;
  alt: string;
  size: number;
}

type ServicioItem = string | ServicioItemLogo;

interface Servicio {
  titulo: string;
  descripcion: string | null;
  items: ServicioItem[] | null;
}

const servicios: Servicio[] = [
  {
    titulo: 'Monturas en tendencia',
    descripcion: 'Diseños modernos, cómodos y de alta calidad.',
    items: null,
  },
  {
    titulo: 'Lentes formulados de alta precisión',
    descripcion: null,
    items: ['Monofocales', 'Progresivos', 'Fotocromáticos', 'De descanso', 'Filtro azul', 'Transitions'],
  },
  {
    titulo: 'Métodos de pago',
    descripcion: null,
    items: [
      { texto: 'Nequi', logo: logoNequi, alt: 'NEQUI', size: 30 },
      { texto: 'Addi', logo: logoAddi, alt: 'ADDI', size: 40 },
      { texto: 'Sistecrédito', logo: logoSistecredito, alt: 'SISTECRÉDITO', size: 40 },
    ],
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="bg-[#008294] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#C39C4E]">
            Nuestros servicios
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            El futuro, a la vista.
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#C39C4E]" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {servicios.map((servicio: Servicio) => (
            <article
              key={servicio.titulo}
              className="group rounded-2xl border border-[#C39C4E]/30 bg-[#006d7a]/60 p-7 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-[#C39C4E] hover:bg-[#006d7a] hover:shadow-[#C39C4E]/10"
            >
              <div className="mb-4 inline-block rounded-full border border-[#C39C4E]/40 bg-[#C39C4E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C39C4E]">
                Servicio
              </div>

              <h3 className="text-xl font-bold text-[#C39C4E] transition group-hover:text-[#d4b06a]">
                {servicio.titulo}
              </h3>

              {servicio.descripcion && (
                <p className="mt-3 leading-relaxed text-blue-50/90">
                  {servicio.descripcion}
                </p>
              )}

              {servicio.items && (
                <ul className="mt-4 space-y-2">
                  {servicio.items.map((item: ServicioItem) => (
                    <li
                      key={typeof item === 'string' ? item : item.texto}
                      className="flex items-center gap-3 text-blue-50/90"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C39C4E]" />
                      {typeof item === 'string' ? (
                        <span>{item}</span>
                      ) : (
                        <span className="flex flex-1 items-center gap-2">
                          {item.texto}
                            <Image
                              src={item.logo}
                              alt={item.alt}
                              width={item.size}
                              height={item.size} 
                              className="inline-block rounded-md transition-transform duration-300 group-hover:scale-110"
                            />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
