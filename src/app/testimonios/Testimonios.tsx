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
    <section id="testimonios" className="w-full bg-white py-12 md:py-16 border-y border-gray-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#e0f2f4] px-3 py-1 rounded-full text-xs font-bold text-[#005f6b] mb-3">★★★★★ 4.8 en Google — 127 reseñas</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#005f6b]">
            Lo que dicen en Medellín e Itagüí
          </h2>
          <p className="mt-2 text-gray-600">
            Clientes reales de la Cra 49 — envío 24-48h y garantía 15 días
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonios.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-slate-50 border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-center gap-1 text-[#D4AF37] text-sm mb-2" aria-label="5 estrellas">★★★★★</div>
              <blockquote className="flex-1">
                <p className="text-sm leading-relaxed text-gray-700">{item.descripcion}</p>
              </blockquote>
              <footer className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#008294] text-white flex items-center justify-center text-xs font-bold">{item.nombre[0]}</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.nombre}</p>
                  <p className="text-xs text-gray-500">{item.ubicacion} • Compra verificada</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-[#e0f2f4] p-3"><p className="font-extrabold text-[#005f6b]">15 días</p><p className="text-xs text-gray-600">Cambios sin costo</p></div>
          <div className="rounded-xl bg-[#e0f2f4] p-3"><p className="font-extrabold text-[#005f6b]">IVA incluido</p><p className="text-xs text-gray-600">Sin sorpresas</p></div>
          <div className="rounded-xl bg-[#e0f2f4] p-3"><p className="font-extrabold text-[#005f6b]">Wompi SSL</p><p className="text-xs text-gray-600">Pago seguro</p></div>
          <div className="rounded-xl bg-[#e0f2f4] p-3"><p className="font-extrabold text-[#005f6b]">Addi/Sistecredito</p><p className="text-xs text-gray-600">Financiación</p></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">¿Dudas? <a href="https://wa.me/573017391219" className="underline text-[#008294]">Chatea por WhatsApp</a> • Visítanos Cra 49 Itagüí</p>
      </div>
    </section>
  );
}