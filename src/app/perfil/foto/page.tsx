"use client";

import { useEffect, useState } from "react";
import ClientPhotoUploader from "../../components/ClientPhotoUploader";
import VirtualTryOn from "../../components/VirtualTryOn";

// Demo page: no reemplaza modalProbador, es ruta nueva /perfil/foto
// Requiere customerId (email único). Para demo, permite ingresarlo manualmente
// o lo recupera de localStorage si existe flujo de RegistroCliente.

const SAMPLE_GLASSES = "/assets/gafasDeSol/gafas de sol1-sin-fondo.png";

export default function PerfilFotoPage() {
  const [customerId, setCustomerId] = useState<string>("");
  const [inputId, setInputId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    // Intenta recuperar customerId de localStorage (RegistroCliente lo guarda)
    const stored = localStorage.getItem("optica-mia-customer-id") || localStorage.getItem("customerId") || "";
    if (stored) {
      setCustomerId(stored);
      setInputId(stored);
    }
  }, []);

  const handleSaveId = () => {
    const trimmed = inputId.trim();
    if (!trimmed) return;
    setCustomerId(trimmed);
    localStorage.setItem("optica-mia-customer-id", trimmed);
  };

  const handleSuccess = (url: string) => {
    setPhotoUrl(url);
    setShowTryOn(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 text-center">Subir foto para Probador Virtual</h1>
        <p className="text-center text-sm text-slate-500 mt-2">
          Tu foto se procesa en tu dispositivo a <strong>1024×1024 PNG</strong> centrada en tu rostro, lista para MediaPipe Tasks Vision.
        </p>

        {/* CustomerId input (email único) */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">Customer ID (email único requerido)</label>
          <div className="mt-2 flex gap-2">
            <input
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="pega tu customerId (cuid)"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008294]"
            />
            <button
              onClick={handleSaveId}
              className="rounded-xl bg-[#008294] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005f6b]"
            >
              Guardar
            </button>
          </div>
          {customerId && <p className="mt-2 text-xs text-green-600">Usando customerId: {customerId}</p>}
          {!customerId && <p className="mt-2 text-xs text-amber-600">Ingresa un Customer válido de la tabla Customer (creado vía /api/customers).</p>}
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {customerId ? (
            <ClientPhotoUploader customerId={customerId} onSuccess={handleSuccess} />
          ) : (
            <p className="text-center text-sm text-slate-400">Ingresa tu Customer ID para habilitar la subida.</p>
          )}
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
