"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import ClientPhotoUploader from "@/app/components/ClientPhotoUploader";
import VirtualTryOn from "@/app/components/VirtualTryOn";

const SAMPLE_GLASSES = "/assets/gafasDeSol/gafas de sol1-sin-fondo.png";

export default function PerfilFotoPage() {
  const { user, isLoading } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const handleSuccess = (url: string) => {
    setPhotoUrl(url);
    setShowTryOn(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso requerido</h1>
          <p className="mt-4 text-gray-600">Debes iniciar sesión para acceder a esta página</p>
          <a href="/login?callback=/perfil/foto" className="mt-6 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 text-center">Subir foto para Probador Virtual</h1>
        <p className="text-center text-sm text-slate-500 mt-2">
          Tu foto se procesa en tu dispositivo a <strong>1024×1024 PNG</strong> centrada en tu rostro, lista para MediaPipe Tasks Vision.
        </p>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <ClientPhotoUploader customerId={user.id} onSuccess={handleSuccess} />
        </div>

        {showTryOn && photoUrl && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-800 text-center">Vista previa en Probador Virtual</h2>
            <p className="text-center text-xs text-slate-400 mt-1">Pipeline MediaPipe directo con tu PNG 1024</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex justify-center">
              <div style={{ width: 446, height: 446 }} className="overflow-hidden rounded-xl">
                <VirtualTryOn
                  glassesFrontalImageUrl={SAMPLE_GLASSES}
                  faceSrc={photoUrl}
                />
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400 break-all">URL: {photoUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}