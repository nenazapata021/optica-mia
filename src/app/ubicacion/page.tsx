export const metadata = {
  title: "Ubicación | Óptica Mía",
  description: "Encuentra la ubicación de Óptica Mía en Google Maps",
};

export default function UbicacionPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold text-[#005f6b]">
        Nuestra Ubicación
      </h1>
      <div className="flex justify-center">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3269.437174439365!2d-75.61524752501005!3d6.169505293817813!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMTAnMTAuMiJOIDc1wrAzNic0NS42Ilc!5e1!3m2!1ses!2sco!4v1784911393451!5m2!1ses!2sco"
          width="100%"
          height="450"
          className="[max-w-[600px]] rounded-xl border-0 shadow-lg"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </main>
  );
}
