import "./globals.css";
import Providers from "./providers";
import Header from "./header/header";
import WhatsAppButton from "./whatsapp/WhatsAppButton";
import Link from "next/link";
import { type ReactNode } from "react";
import type { Metadata } from "next";
import ConsentBanner from "@/components/security/ConsentBanner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://opticamia.com.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Óptica Mía | Monturas y Lentes Formulados en Itagüí - 452 Cra 49",
    template: "%s | Óptica Mía",
  },
  description:
    "Compra monturas, lentes formulados y gafas de sol en Itagüí (452 Cra. 49) y Medellín. Probador virtual con IA, envío gratis 24-48h, paga con Nequi, Addi o Sistecredito. ¡Agenda tu examen visual!",
  keywords: [
    "óptica itagüí",
    "óptica medellín",
    "monturas itagüí",
    "lentes formulados itagüí",
    "gafas de sol medellín",
    "probador virtual gafas",
    "óptica cerca de mí",
    "452 cra 49 itagüí",
  ],
  authors: [{ name: "Óptica Mía" }],
  creator: "Óptica Mía",
  publisher: "Óptica Mía",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: "Óptica Mía",
    title: "Óptica Mía | Monturas y Lentes en Itagüí - 452 Cra 49",
    description: "Monturas en tendencia, lentes de alta precisión y probador virtual con IA. Envío gratis Medellín.",
    images: [{ url: "/monturas/foto1.png", width: 1200, height: 630, alt: "Óptica Mía Itagüí - 452 Cra 49" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Óptica Mía | Monturas y Lentes en Itagüí",
    description: "Probador virtual IA. Monturas, lentes formulados y gafas de sol con envío gratis Medellín/Itagüí.",
    images: ["/monturas/foto1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers>
          <Header />

          <main className="[flex-grow]">
            {children}
          </main>

          <WhatsAppButton />
          <ConsentBanner />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Optician",
                name: "Óptica Mía",
                url: SITE_URL,
                logo: `${SITE_URL}/monturas/foto1.png`,
                image: `${SITE_URL}/monturas/foto1.png`,
                description: "Óptica en Itagüí 452 Cra. 49, Antioquia. Monturas, lentes formulados y gafas de sol con probador virtual IA. Envío gratis Medellín/Itagüí.",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Cra. 49 #45-12",
                  addressLocality: "Itagüí",
                  addressRegion: "Antioquia",
                  postalCode: "055412",
                  addressCountry: "CO",
                },
                geo: { "@type": "GeoCoordinates", latitude: 6.169499839592879, longitude: -75.61269963490861 },
                telephone: "+573017391219",
                sameAs: [
                  "https://www.instagram.com/opticamia.virtual/",
                  "https://www.tiktok.com/@opticamia.virtual?_r=1&_t=ZS-98bq2OaQOmb",
                  "https://youtube.com/@opticamia.virtual?si=tOrHd7o_i0dEKEvp",
                ],
                priceRange: "$$",
                openingHours: "Mo-Sa 09:00-18:00",
                areaServed: [{ "@type": "City", name: "Itagüí" }, { "@type": "City", name: "Medellín" }],
              }),
            }}
          />
          <footer
            className="py-8 text-sm"
            style={{ backgroundColor: "#008294", color: "#C39A3C" }}
          >
            <div className="mx-auto max-w-6xl px-6">
              <div className="grid gap-8 md:grid-cols-3">
                <div>
                  <p className="font-bold text-white">Óptica Mía</p>
                  <p className="mt-2 text-[#e8d5a3] text-xs leading-relaxed">
                    Cra. 49 #45-12, Santa María
                    <br />
                    Itagüí, Antioquia 055412
                    <br />
                    <a href="https://wa.me/573017391219" className="underline hover:text-white">
                      +57 301 739 1219
                    </a>
                    <br />
                    Lun - Sáb 9am - 6pm • Envío gratis Medellín/Itagüí
                  </p>
                </div>
                <nav aria-label="Enlaces" className="flex flex-col gap-2">
                  <p className="font-semibold text-white text-xs uppercase tracking-widest">Explorar</p>
                  <Link href="/lentes" className="hover:text-white transition text-[#e8d5a3]">Lentes formulados</Link>
                  <Link href="/gafas-de-sol" className="hover:text-white transition text-[#e8d5a3]">Gafas de Sol</Link>
                  <Link href="/probador-landing" className="hover:text-white transition text-[#e8d5a3]">Probador Virtual IA</Link>
                  <Link href="/ubicacion" className="hover:text-white transition text-[#e8d5a3]">Nuestras Tiendas - Itagüí</Link>
                </nav>
                <div>
                  <p className="font-semibold text-white text-xs uppercase tracking-widest">Síguenos</p>
                  <div className="mt-3 flex gap-3">
                    <a href="https://www.instagram.com/opticamia.virtual/" target="_blank" rel="noopener noreferrer me" className="hover:text-white underline text-[#e8d5a3]">Instagram</a>
                    <a href="https://www.tiktok.com/@opticamia.virtual?_r=1&_t=ZS-98bq2OaQOmb" target="_blank" rel="noopener noreferrer me" className="hover:text-white underline text-[#e8d5a3]">TikTok</a>
                    <a href="https://youtube.com/@opticamia.virtual?si=tOrHd7o_i0dEKEvp" target="_blank" rel="noopener noreferrer me" className="hover:text-white underline text-[#e8d5a3]">YouTube</a>
                  </div>
                  <p className="mt-3 text-[11px] text-[#e8d5a3]/80">Pagos seguros con Wompi • SSL 256 bits</p>
                </div>
              </div>
              <div className="mt-8 border-t border-[#C39A3C]/30 pt-4 text-center text-xs text-[#e8d5a3]">
                © {new Date().getFullYear()} Óptica Mía — 452 Cra. 49, Itagüí. Todos los derechos reservados.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
