"use client";

import { ArrowLeft, X, FileUp, Pencil, Clock, Mail } from "lucide-react";

interface SubeFormulaPageProps {
  onSelectOption?: () => void;
}

export default function SubeFormulaPage({
  onSelectOption,
}: SubeFormulaPageProps) {
  return (
    <div className="max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 py-3">
        <button className="p-2" onClick={onSelectOption}>
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 mx-4 h-1 bg-gray-200 rounded-full">
          <div className="h-full bg-black rounded-full" style={{ width: "85%" }} />
        </div>
        <button className="p-2" onClick={onSelectOption}>
          <X size={24} />
        </button>
      </header>

      <h1 className="text-center text-2xl font-bold mt-4 mb-8">
        Sube tu fórmula
      </h1>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <button
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow w-full"
          onClick={onSelectOption}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <FileUp size={20} />
          </div>
          <span className="font-bold text-left">
            Sube una foto o archivo de tu fórmula
          </span>
        </button>

        <button
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow w-full"
          onClick={onSelectOption}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Pencil size={20} />
          </div>
          <span className="font-bold text-left">
            Ingresa tu fórmula manualmente
          </span>
        </button>

        <button
          className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow w-full"
          onClick={onSelectOption}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Clock size={16} />
            <Mail size={16} />
          </div>
          <span className="font-bold text-left">
            Enviar después de compra a formula@opticamia.com
          </span>
        </button>
      </div>
    </div>
  );
}