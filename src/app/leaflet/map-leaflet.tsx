"use client";

import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("./MapContent"),
  { ssr: false, loading: () => <div className="[h-[450px]] w-full animate-pulse rounded-xl bg-gray-200" /> }
);

const POSITION: [number, number] = [6.1695, -75.61525];

export default function MapView() {
  return (
    <div className="w-full overflow-hidden rounded-xl shadow-lg">
      <MapContainer center={POSITION} />
    </div>
  );
}
