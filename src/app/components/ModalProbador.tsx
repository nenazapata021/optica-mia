"use client";

import { type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Upload, X } from "lucide-react";
import { type Producto } from "../types/producto";

interface ModalProbadorProps {
  producto: Producto;
  onClose: () => void;
}

export default function ModalProbador({ producto, onClose }: ModalProbadorProps) {
  const router = useRouter();

  const handleNavigation = () => {
    // Navega a la página del probador, pasando el ID del producto
    router.push(`/probador?productoId=${producto.id}`);
  };

  // Evita que el clic dentro del modal lo cierre
  const handleModalContentClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={onClose} // Cierra el modal si se hace clic en el fondo
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl text-center transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-[#005f6b] mb-3">
          Simulador Virtual IA
        </h2>
        <p className="text-slate-500 mb-6">
          Prueba cómo te queda esta montura antes de decidirte.
        </p>

        {/* Información de la montura */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-8">
          <div className="relative h-20 w-20 [flex-shrink-0] overflow-hidden rounded-lg">
            <Image
              src={Array.isArray(producto.image) ? producto.image[0] : producto.image}
              alt={producto.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500">Montura seleccionada</p>
            <h3 className="text-lg font-bold text-slate-800">{producto.name}</h3>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleNavigation}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-100"
            style={{ backgroundColor: "#008294" }}
          >
            <Camera size={32} />
            <span className="text-lg">Tomar foto</span>
          </button>
          <button
            onClick={handleNavigation}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 font-semibold text-slate-700 bg-slate-100 border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-100"
          >
            <Upload size={32} />
            <span className="text-lg">Subir foto</span>
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}