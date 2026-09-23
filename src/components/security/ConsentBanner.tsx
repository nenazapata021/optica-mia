"use client";
import { useEffect, useState } from "react";

const KEY = "optica-mia-consent-1581";
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 rounded-2xl bg-slate-900 text-white p-5 shadow-2xl">
      <p className="text-sm leading-relaxed">
        Usamos tus datos (nombre, correo, teléfono) solo para procesar tu pedido y envíos en Medellín/Itagüí, según la <strong>Ley 1581 de 2012</strong>. No compartimos datos con terceros salvo Wompi/Addi/Sistecredito para el pago. 
        <a href="/privacidad" className="underline ml-1">Ver política</a>
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => { localStorage.setItem(KEY, "1"); setVisible(false); }} className="flex-1 rounded-xl bg-[#008294] py-2.5 text-sm font-semibold hover:bg-[#005f6b]">Aceptar</button>
        <button onClick={() => setVisible(false)} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm">Cerrar</button>
      </div>
    </div>
  );
}
