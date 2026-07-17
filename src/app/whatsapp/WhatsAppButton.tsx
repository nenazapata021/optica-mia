"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/573017391219";

const MENSAJES = [
  "Habla con un agente",
  "Pide asesoría aquí",
  "Envía tu fórmula aquí",
];

export default function WhatsAppButton() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje] = useState(
    () => MENSAJES[Math.floor(Math.random() * MENSAJES.length)],
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-[#20BD5C] hover:scale-105 active:scale-95"
        aria-label="Abrir chat de WhatsApp"
      >
        <MessageCircle size={24} />
        <span suppressHydrationWarning className="hidden text-sm sm:inline">{mensaje}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div className="w-72 rounded-2xl bg-white p-5 shadow-xl">
        <p className="mb-4 text-sm text-slate-600">
          ¿Necesitas ayuda? Uno de nuestros agentes te atenderá en WhatsApp.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:bg-[#20BD5C]"
        >
          <MessageCircle size={20} />
          Iniciar chat
        </a>
      </div>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="flex items-center gap-2 rounded-full bg-slate-700 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-slate-600"
        aria-label="Cerrar ventana de WhatsApp"
      >
        <X size={18} />
        Cerrar
      </button>
    </div>
  );
}
