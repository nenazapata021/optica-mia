export const metadata = {
  title: "Ubicación | Óptica Mía",
  description:
    "Encuéntranos en Itagui, Antioquia. Visítanos y elige tus gafas favoritas.",
};

const STORE_NAME = "Óptica Mía";
const STORE_ADDRESS = "Itagui, Antioquia, Colombia";
const STORE_COORDS = { lat: 6.169499839592879, lng: -75.61269963490861 };
const GOOGLE_MAPS_URL = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}&z=16&hl=es`;

export default function UbicacionPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-[#005f6b]">
        {STORE_NAME}
      </h1>
      <p className="mb-8 text-center text-gray-500">
        {STORE_ADDRESS}
      </p>

      <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <iframe
          src={`https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}&z=16&hl=es&output=embed`}
          width="100%"
          height="450"
          className="[border-0]"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={`Mapa de ${STORE_NAME}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-[#005f6b]">
            Cómo llegar
          </h2>
          <p className="text-sm text-gray-600">
            Te esperamos en nuestro punto para que te hagas el examen ocular.
          </p>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
          >
            Ver en Google Maps
          </a>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-[#005f6b]">
            Datos de contacto
          </h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-[#D4AF37]">📍</span>
              <span>{STORE_ADDRESS}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-[#D4AF37]">📞</span>
              <a
                href="https://wa.me/573017391219"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37]"
              >
                +57 301 739 1219
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-[#D4AF37]">📧</span>
              <span>Contacto por WhatsApp o redes sociales</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}