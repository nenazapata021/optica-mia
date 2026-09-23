import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold tracking-widest text-[#008294]">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Página no encontrada</h1>
      <p className="mt-3 text-gray-600">¿Buscabas lentes en Itagüí? Vuelve al catálogo o al probador virtual IA.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="rounded-full bg-[#008294] px-6 py-3 text-sm font-semibold text-white">Inicio</Link>
        <Link href="/lentes" className="rounded-full border border-[#008294] px-6 py-3 text-sm font-semibold text-[#008294]">Lentes</Link>
        <Link href="/probador-landing" className="rounded-full border border-[#008294] px-6 py-3 text-sm font-semibold text-[#008294]">Probador IA</Link>
      </div>
    </main>
  );
}
