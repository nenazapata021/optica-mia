import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { productosLentes, productosGafasSol } from "../../data/productos.js";
import AddToCartSection from "./AddToCartSection";

type Params = { id: string };
const allProducts = [...productosLentes, ...productosGafasSol];
function findProduct(id: string) { return allProducts.find((p) => p.id === id); }
function toSrc(img: unknown): string {
  if (typeof img === "string") return img;
  if (img && typeof img === "object" && "src" in (img as Record<string, unknown>)) return (img as { src: string }).src;
  return "/monturas/foto1.png";
}
export function generateStaticParams(): { id: string }[] { return allProducts.map((p) => ({ id: p.id })); }
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params; const product = findProduct(id);
  if (!product) return { title: "Producto no encontrado" };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://opticamia.com.co";
  const title = `${product.nombre} ${product.color} | Óptica Mía Itagüí 452 Cra 49`;
  const description = `${product.nombre} color ${product.color} (${product.categoria}) $${product.precio.toLocaleString("es-CO")} COP. Lentes formulados en Itagüí. Probador IA y envío gratis Medellín.`;
  return { title, description, alternates: { canonical: `/producto/${id}` }, openGraph: { title, description, url: `${baseUrl}/producto/${id}`, type: "website", images: [{ url: toSrc(product.imagen), width: 800, height: 600, alt: product.nombre }] } };
}

export default async function ProductoPage({ params }: { params: Promise<Params> }) {
  const { id } = await params; const product = findProduct(id); if (!product) notFound();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://opticamia.com.co";
  const categoriaLabel = product.categoria === "ninos" ? "Niños" : product.categoria === "sol" ? "Gafas de Sol" : product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1);
  const imageSrc = toSrc(product.imagen);
  const priceCOP = product.precio.toLocaleString("es-CO");

  const productJsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.nombre,
    description: `${product.nombre} color ${product.color}, categoría ${categoriaLabel}. Óptica Mía Itagüí 452 Cra 49 con probador virtual IA. Envío gratis Medellín/Itagüí.`,
    image: `${baseUrl}${imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`}`, sku: product.id,
    brand: { "@type": "Brand", name: "Óptica Mía" }, category: categoriaLabel, color: product.color,
    offers: { "@type": "Offer", url: `${baseUrl}/producto/${product.id}`, priceCurrency: "COP", price: product.precio, availability: "https://schema.org/InStock", seller: { "@type": "Organization", name: "Óptica Mía" }, areaServed: [{ "@type": "City", name: "Itagüí" }, { "@type": "City", name: "Medellín" }] },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
      { "@type": "ListItem", position: 2, name: categoriaLabel, item: `${baseUrl}/${product.categoria === "sol" ? "gafas-de-sol" : "lentes"}` },
      { "@type": "ListItem", position: 3, name: product.nombre, item: `${baseUrl}/producto/${product.id}` },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-[#008294] underline">Inicio</Link> <span>/</span></li>
          <li><Link href={product.categoria === "sol" ? "/gafas-de-sol" : "/lentes"} className="hover:text-[#008294] underline capitalize">{categoriaLabel}</Link> <span>/</span></li>
          <li aria-current="page" className="text-gray-800 font-medium">{product.nombre}</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50 border">
          <Image src={imageSrc} alt={`${product.nombre} ${product.color} - Montura ${categoriaLabel} Óptica Mía Itagüí 452 Cra 49`} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-contain p-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#008294]">{categoriaLabel} • {product.color}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">{product.nombre}</h1>
          <p className="mt-2 text-3xl font-bold text-[#008294]">${priceCOP} COP</p>
          <p className="mt-1 text-sm text-green-600">✓ En stock • Envío gratis Medellín/Itagüí • 452 Cra 49</p>

          <div className="mt-6 rounded-xl bg-[#e0f2f4] p-4">
            <h2 className="font-semibold text-[#005f6b]">¿Por qué Óptica Mía Itagüí?</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• Probador virtual IA móvil: mírala en tu rostro al instante</li>
              <li>• Lentes formulados: monofocales, progresivos, fotocromáticos, filtro azul</li>
              <li>• Paga con Nequi, Addi, Sistecredito o Bre-B (Wompi seguro)</li>
              <li>• WhatsApp +57 301 739 1219 • Cra 49 Itagüí</li>
            </ul>
          </div>

          <AddToCartSection product={{ id: product.id, name: product.nombre, price: product.precio, image: imageSrc, categoria: product.categoria as "mujer"|"hombre"|"ninos"|"sol", color: product.color }} />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/probador-landing" className="rounded-full border-2 border-[#008294] px-6 py-2.5 text-sm font-semibold text-[#008294] hover:bg-[#008294] hover:text-white transition">Probar virtualmente</Link>
            <Link href="/ubicacion" className="rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-[#C39C4E] transition">Ver tienda 452 Cra 49</Link>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-800">Detalles</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-gray-500">Referencia</dt><dd className="font-medium">{product.id}</dd></div>
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-gray-500">Categoría</dt><dd className="font-medium capitalize">{categoriaLabel}</dd></div>
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-gray-500">Color</dt><dd className="font-medium">{product.color}</dd></div>
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-gray-500">Precio</dt><dd className="font-medium">${priceCOP}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              La {product.nombre.toLowerCase()} en {product.color.toLowerCase()} es ideal para {categoriaLabel.toLowerCase()} que busca montura liviana en Itagüí/Medellín. Compatible con lentes formulados de alta precisión. Agenda tu examen en 452 Cra 49 o pide envío 24-48h Valle de Aburrá. Contenido único por ficha para evitar thin content.
            </p>
          </section>
          <section className="mt-8 rounded-xl border p-4">
            <h2 className="font-semibold">FAQ</h2>
            <details className="mt-2"><summary className="cursor-pointer font-medium">¿Incluye lentes formulados?</summary><p className="mt-1 text-sm text-gray-600">Elige monofocales/progresivos/fotocromáticos al añadir al carrito.</p></details>
            <details className="mt-2"><summary className="cursor-pointer font-medium">¿Envío a Medellín?</summary><p className="mt-1 text-sm text-gray-600">Sí, gratis Medellín e Itagüí. Fuera del Valle coordinamos por WhatsApp.</p></details>
            <details className="mt-2"><summary className="cursor-pointer font-medium">¿Garantía?</summary><p className="mt-1 text-sm text-gray-600">Garantía por defectos de fabricación. Ver en tienda 452 Cra 49.</p></details>
          </section>
        </div>
      </div>
      <div className="mt-10"><Link href={product.categoria === "sol" ? "/gafas-de-sol" : "/lentes"} className="text-sm font-medium text-[#008294] hover:underline">← Volver al catálogo</Link></div>
    </main>
  );
}
