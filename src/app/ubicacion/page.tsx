import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestras Tiendas | Óptica Mía 452 Cra 49 Itagüí",
  description:
    "Visítanos en Cra. 49 #45-12, Santa María, Itagüí (Antioquia). A 15 min de Medellín. Examen visual, probador IA, paga con Nequi/Addi/Sistecredito. Tel: +57 301 739 1219.",
  alternates: { canonical: "/ubicacion" },
  openGraph: { title: "Óptica Mía - Tienda Itagüí 452 Cra 49", description: "Cómo llegar desde Medellín. Mapa, horario y contacto.", url: "/ubicacion", type: "website" },
};

const STORE_NAME = "Óptica Mía";
const STORE_ADDRESS = "Cra. 49 #45-12, Santa María, Itagüí, Antioquia 055412";
const STORE_COORDS = { lat: 6.169499839592879, lng: -75.61269963490861 };
const GOOGLE_MAPS_URL = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}&z=16&hl=es`;

export default function UbicacionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Optician",
    name: STORE_NAME,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Cra. 49 #45-12",
      addressLocality: "Itagüí",
      addressRegion: "Antioquia",
      postalCode: "055412",
      addressCountry: "CO",
    },
    geo: { "@type": "GeoCoordinates", latitude: STORE_COORDS.lat, longitude: STORE_COORDS.lng },
    telephone: "+573017391219",
    openingHours: "Mo-Sa 09:00-18:00",
    areaServed: [{ "@type": "City", name: "Itagüí" }, { "@type": "City", name: "Medellín" }],
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="mb-2 text-center text-3xl font-bold text-[#005f6b]">
        {STORE_NAME}
      </h1>
      <p className="mb-1 text-center text-sm font-medium text-gray-700">{STORE_ADDRESS}</p>
      <p className="mb-8 text-center text-sm text-gray-500">A 15 min de Medellín • Envío gratis Valle de Aburrá • Examen visual en sede</p>

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