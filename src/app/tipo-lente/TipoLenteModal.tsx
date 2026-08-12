"use client";

import { useState } from "react";
import { X, ArrowLeft, Ban, Monitor, Sun, Moon, Check } from "lucide-react";
import { type Producto } from "../types/producto";

interface TipoLenteModalProps {
  producto: Producto;
  colores: string[];
  onSelect: (tipo: string, color?: string) => void;
  onClose: () => void;
}

interface OpcionLente {
  id: string;
  titulo: string;
  descripcion: string;
}

const OPCIONES_PASO1: OpcionLente[] = [
  {
    id: "con-formula",
    titulo: "Lentes con fórmula",
    descripcion:
      "Lentes hechos a tu medida para corregir tu visión de cerca o tu visión de lejos",
  },
  {
    id: "solo-montura",
    titulo: "Solo montura",
    descripcion:
      "Incluye lente de muestra sin protección ni fórmula",
  },
  {
    id: "progresivos",
    titulo: "Lentes",
    descripcion:
      "Corrigen visión de cerca, intermedia y de lejos en un solo lente, sin cambiar de gafas",
  },
];

interface OpcionLenteIcono extends OpcionLente {
  icono: "ban" | "monitor" | "sun-moon";
}

const OPCIONES_PROGRESIVOS = [
  { id: "monofocales", titulo: "Monofocales" },
  { id: "progresivos", titulo: "Progresivos" },
  { id: "fotocromaticos", titulo: "Fotocromáticos" },
  { id: "descanso", titulo: "De descanso" },
  { id: "filtro-azul", titulo: "Filtro azul" },
  { id: "transitions", titulo: "Transitions" },
];

const OPCIONES_PASO2: OpcionLenteIcono[] = [
  {
    id: "transparentes",
    titulo: "Transparentes",
    descripcion:
      "Claridad total: sin alterar colores, perfectos para lectura y uso diario.",
    icono: "ban",
  },
  {
    id: "pantallas",
    titulo: "Lentes para pantallas",
    descripcion:
      "Lentes con filtro de luz azul que ayuda a reducir la fatiga visual por el uso de pantallas.",
    icono: "monitor",
  },
  {
    id: "fotocromaticos",
    titulo: "Fotocromáticos (Transitions)",
    descripcion:
      "Lentes que reaccionan con la luz solar: claros en interiores y oscuros al aire libre.",
    icono: "sun-moon",
  },
];

const TOTAL_PASOS = 3;

const COLOR_MAP: Record<string, string> = {
  negro: "#000000",
  blanco: "#FFFFFF",
  plata: "#C0C0C0",
  azul: "#2563EB",
  rojo: "#DC2626",
  verde: "#16A34A",
  marr\u00f3n: "#8B4513",
  marron: "#8B4513",
  carey: "#D2691E",
  dorado: "#FFD700",
  oro: "#FFD700",
  transparente: "#F5F5F5",
  gris: "#6B7280",
  rosado: "#EC4899",
  violeta: "#8B5CF6",
};

function colorHex(nombre: string): string {
  return COLOR_MAP[nombre.toLowerCase().trim()] || "#CCCCCC";
}

function IconoPaso2({ tipo }: { tipo: "ban" | "monitor" | "sun-moon" }) {
  switch (tipo) {
    case "ban":
      return <Ban size={24} />;
    case "monitor":
      return <Monitor size={24} />;
    case "sun-moon":
      return (
        <span className="flex items-center">
          <Sun size={16} className="text-amber-500" />
          <Moon size={16} className="-ml-1 text-indigo-500" />
        </span>
      );
  }
}

export default function TipoLenteModal({
  colores,
  onSelect,
  onClose,
}: TipoLenteModalProps) {
  const [paso, setPaso] = useState(1);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [tipoPrincipal, setTipoPrincipal] = useState<string | null>(null);
  const [subtipo, setSubtipo] = useState<string | null>(null);

  const handleClickPaso1 = (id: string) => {
    setSeleccionado(id);
    if (id === "con-formula") {
      setTipoPrincipal("con-formula");
      setPaso(2);
    } else if (id === "solo-montura") {
      setTipoPrincipal("solo-montura");
      setPaso(3);
    } else if (id === "progresivos") {
      setTipoPrincipal("progresivos");
      setPaso(4);
    }
  };

  const handleClickPaso2 = (id: string) => {
    setSeleccionado(id);
    onSelect("con-formula-" + id);
  };

  const handleClickProgresivo = (id: string) => {
    setSeleccionado(id);
    setSubtipo(id);
    setPaso(3);
  };

  const handleClickPaso3 = (color: string) => {
    setSeleccionado(color);
    if (tipoPrincipal === "progresivos" && subtipo) {
      onSelect("progresivos-" + subtipo, color);
    } else {
      onSelect("solo-montura", color);
    }
  };

  const volver = () => {
    setSeleccionado(null);
    if (paso === 2) setPaso(1);
    else if (paso === 3) {
      if (tipoPrincipal === "progresivos") { setSubtipo(null); setPaso(4); }
      else setPaso(1);
    }
    else if (paso === 4) setPaso(1);
  };

  const mostrarVolver = paso === 2 || paso === 3 || paso === 4;
  const pasoProgreso = paso === 1 ? 1 : paso === 3 ? 3 : 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center gap-3">
          {mostrarVolver && (
            <button
              onClick={volver}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Volver"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          <div className="flex items-center gap-1.5 flex-1">
            {Array.from({ length: TOTAL_PASOS }, (_, i) => (
              <div
                key={i}
                className={
                  "h-2 flex-1 rounded-sm " +
                  (i < pasoProgreso ? "bg-[#D4AF37]" : "bg-gray-200")
                }
              />
            ))}
          </div>

          <span className="text-xs text-gray-400 whitespace-nowrap">
            Paso {pasoProgreso} de {TOTAL_PASOS}
          </span>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {paso === 1 && (
          <>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Elije el tipo de lentes que quieres
            </h2>
            <div className="flex flex-col gap-3">
              {OPCIONES_PASO1.map((opcion) => (
                <button
                  key={opcion.id}
                  onClick={() => handleClickPaso1(opcion.id)}
                  className={
                    "w-full rounded-xl border-2 p-4 text-left transition-all duration-200 " +
                    (seleccionado === opcion.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
                      : "border-gray-200 bg-white hover:border-[#D4AF37] hover:shadow-md")
                  }
                >
                  <p className="text-base font-bold text-gray-800">
                    {opcion.titulo}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {opcion.descripcion}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 leading-tight">
              Elige el tipo de lentes
              <br />
              para tus gafas con f\u00f3rmula
            </h2>
            <div className="flex flex-col gap-3">
              {OPCIONES_PASO2.map((opcion) => (
                <button
                  key={opcion.id}
                  onClick={() => handleClickPaso2(opcion.id)}
                  className={
                    "flex items-center gap-4 w-full rounded-xl border-2 p-4 text-left transition-all duration-200 " +
                    (seleccionado === opcion.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
                      : "border-gray-200 bg-white hover:border-[#D4AF37] hover:shadow-md")
                  }
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-gray-600">
                    <IconoPaso2 tipo={opcion.icono} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-800">
                      {opcion.titulo}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {opcion.descripcion}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Elige el color de tu montura
            </h2>
            {colores.length === 0 ? (
              <p className="text-center text-gray-500">
                Este producto no tiene colores disponibles.
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {colores.map((color) => {
                  const esSeleccionado = seleccionado === color;
                  return (
                    <button
                      key={color}
                      onClick={() => handleClickPaso3(color)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={
                          "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200 " +
                          (esSeleccionado
                            ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-110"
                            : "border-gray-300 hover:border-[#D4AF37] hover:scale-105")
                        }
                        style={{ backgroundColor: colorHex(color) }}
                      >
                        {esSeleccionado && (
                          <Check
                            size={20}
                            className={
                              color.toLowerCase().trim() === "blanco"
                                ? "text-gray-700"
                                : "text-white"
                            }
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {color}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {paso === 4 && (
          <>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 leading-tight">
              Elige el tipo de lentes
              <br />
              progresivos que necesitas
            </h2>
            <div className="flex flex-col gap-2">
              {OPCIONES_PROGRESIVOS.map((opcion) => (
                <button
                  key={opcion.id}
                  onClick={() => handleClickProgresivo(opcion.id)}
                  className={
                    "w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 " +
                    (seleccionado === opcion.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
                      : "border-gray-200 bg-white hover:border-[#D4AF37] hover:shadow-md")
                  }
                >
                  <p className="text-base font-bold text-gray-800">
                    {opcion.titulo}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
