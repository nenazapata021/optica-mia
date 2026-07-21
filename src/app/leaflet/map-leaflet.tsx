export default function MapView() {
  return (
    <div className="w-full overflow-hidden rounded-xl shadow-lg">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3269.437174439365!2d-75.61524752501005!3d6.169505293817813!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMTAnMTAuMiJOIDc1wrAzNic0NS42Ilc!5e1!3m2!1ses!2sco!4v1784646037981!5m2!1ses!2sco"
        title="Ubicación de Óptica Mía en Google Maps"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="block w-full max-md:h-75"
      />
    </div>
  );
}