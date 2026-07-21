import MapView from "../leaflet/map-leaflet";

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
      <MapView />
    </main>
  );
}
