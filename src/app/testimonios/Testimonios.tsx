"use client";

// Datos de ejemplo para los testimonios. Puedes reemplazarlos con los tuyos.
const testimonios = [
  {
    id: 1,
    nombre: "Laura Gómez",
    ubicacion: "Medellín, Colombia",
    descripcion: "¡El servicio es increíble! Me ayudaron a elegir la montura perfecta y el proceso fue súper rápido. Mis nuevas gafas son hermosas y de excelente calidad. ¡Totalmente recomendados!",
  },
  {
    id: 2,
    nombre: "Carlos Pérez",
    ubicacion: "Medellín, Colombia",
    descripcion: "Tenía dudas sobre comprar gafas online, pero la asesoría fue excelente. Al principio sentí la nueva fórmula un poco extraña, pero al día siguiente mi visión era perfecta. ¡Muy profesionales!",
  },
  {
    id: 3,
    nombre: "Ana Sofía R.",
    ubicacion: "Medellín, Colombia",
    descripcion: "Recibí mis gafas hoy y no podría estar más feliz. El envío fue rápido y me quedaron perfectas, tal como las vi en las fotos. ¡Muchas gracias por todo!",
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
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="flex flex-1 flex-col justify-between p-6">
                <blockquote className="flex-1">
                  <p className="text-lg text-gray-700">{item.descripcion}</p>
                </blockquote>
                <footer className="mt-4">
                  <p className="font-bold text-gray-900">{item.nombre}</p>
                  <p className="text-sm text-gray-500">{item.ubicacion}</p>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}