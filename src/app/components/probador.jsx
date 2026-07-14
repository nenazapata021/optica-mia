"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext.jsx";
import logoOpticaMia from "../assets/optica-mia.jpg";
import ProductoDestacado from "./ProductoDestacado.jsx";
import foto1 from '../assets/foto1.jpg';
import foto2 from '../assets/foto2.jpg';
import foto3 from '../assets/foto3.jpg';
import foto4 from '../assets/foto4.jpg';
import foto5 from '../assets/foto5.jpg';
import foto6 from '../assets/foto6.jpg';

const todosProd = [
  { id: 'p1', nombre: 'Montura Clásica', precio: 120000, imagen: foto1, categoria: 'mujer', color: 'Transparente' },
  { id: 'p2', nombre: 'Montura Rosa', precio: 150000, imagen: foto2, categoria: 'mujer', color: 'Rosa' },
  { id: 'p3', nombre: 'Montura Dorada', precio: 180000, imagen: foto3, categoria: 'mujer', color: 'Dorado' },
  { id: 'p4', nombre: 'Montura Ejecutiva', precio: 175000, imagen: foto4, categoria: 'hombre', color: 'Cobre' },
  { id: 'p5', nombre: 'Montura Kids', precio: 95000, imagen: foto5, categoria: 'niños', color: 'Cobre' },
  { id: 'p6', nombre: 'Gafas de Sol Aviador', precio: 210000, imagen: foto6, categoria: 'sol', color: 'Negro' },
];
/* ─── Icono gafas SVG ─── */
function IconGafas({ size = 48, color = "#008294" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h2a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-1" />
      <path d="M22 9h-2a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-1" />
      <line x1="2" y1="9" x2="22" y2="9" />
    </svg>
  );
}

/* ─── Modal de bienvenida ─── */
function ModalBienvenida({ producto, onTomarFoto, onSubirFoto, onCerrar }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onSubirFoto(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 flex flex-col items-center text-center"
        style={{ animation: "fadeInUp 0.35s ease" }}
      >
        {/* Cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl font-light leading-none"
        >
          ×
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2 mb-1">
          <IconGafas size={28} color="#008294" />
          <h2 className="text-xl font-bold text-gray-800">Simulador Virtual IA</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Prueba cómo se verá esta montura en tu rostro con inteligencia artificial
        </p>

        {/* Icono central */}
        <div
          className="flex items-center justify-center rounded-full mb-6"
          style={{ width: 96, height: 96, backgroundColor: "#e6f4f6" }}
        >
          <IconGafas size={48} color="#008294" />
        </div>

        {/* Montura seleccionada */}
        {producto && (
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Montura seleccionada</p>
        )}
        {producto && (
          <p className="text-sm font-semibold text-gray-700 mb-5">{producto.nombre}</p>
        )}

        {/* Instrucciones */}
        <p className="text-base font-semibold text-gray-800 mb-1">
          Toma una foto o sube una imagen frontal de tu rostro
        </p>
        <p className="text-sm text-gray-400 mb-1">
          La IA generará una simulación realista con la montura seleccionada
        </p>
        <p className="text-sm text-gray-400 mb-7">
          Toma o sube la foto cuando estés listo. La IA generará una simulación realista.
        </p>

        {/* Botones */}
        <button
          type="button"
          onClick={onTomarFoto}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white text-base mb-3 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#008294" }}
        >
          <span>📷</span> Tomar foto
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
        >
          <span>⬆️</span> Subir foto
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Define camera error configurations
const cameraErrorDefinitions = {
  permisos: {
    titulo: "Permiso de cámara denegado",
    detalle: "Bloqueaste el acceso a la cámara. Ve a la configuración de tu navegador, permite el acceso a la cámara para este sitio y recarga la página.",
    icono: "🔒",
  },
  "no-encontrada": {
    titulo: "No se encontró ninguna cámara",
    detalle: "Tu dispositivo no tiene cámara disponible o no está conectada correctamente. Puedes subir una foto en su lugar.",
    icono: "📷",
  },
  "en-uso": {
    titulo: "Cámara ocupada por otra aplicación",
    detalle: "La cámara está siendo usada por otro programa (videollamada, otra pestaña, etc.). Ciérralo e inténtalo de nuevo.",
    icono: "⚠️",
  },
  configuracion: {
    titulo: "Configuración de cámara no compatible",
    detalle: "Tu cámara no admite la resolución requerida. Intenta de nuevo; usaremos una resolución más baja.",
    icono: "⚙️",
  },
  desconocido: {
    titulo: "No se pudo activar la cámara",
    detalle: "Ocurrió un error inesperado al intentar acceder a la cámara. Revisa los permisos del navegador o sube una foto en su lugar.",
    icono: "🚫",
  },
};

/* ─── Icono gafas SVG ─── */


/* ─── Modal de error de cámara ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModalErrorCamara({ error, onReintentar, onSubirFoto, onCerrar }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onSubirFoto(file);
  };

  const colorBorde = {
    permisos:       "#ef4444",
    "no-encontrada": "#f97316",
    "en-uso":        "#eab308",
    configuracion:  "#8b5cf6",
    desconocido:    "#6b7280",
  }[error.tipo] ?? "#6b7280";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 flex flex-col items-center text-center"
        style={{ animation: "fadeInUp 0.35s ease", borderTop: `5px solid ${colorBorde}` }}
      >
        {/* Cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl font-light leading-none"
        >
          ×
        </button>

        {/* Brand Info */}
        <div className="flex items-center gap-2 mb-1">
          <Image
            src={logoOpticaMia}
            alt="Logo Óptica Mia"
            className="h-8 w-8 rounded-full object-cover border border-gray-200"
          />
          <h3 className="text-lg font-bold text-gray-800">Óptica Mia</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">El futuro, a la vista.</p>

        {/* Icono grande */}
        <div
          className="flex items-center justify-center rounded-full mb-5 text-4xl"
          style={{ width: 80, height: 80, backgroundColor: `${colorBorde}18` }}
        >
          {error.icono}
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">{error.titulo}</h2>

        {/* Detalle */}
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">{error.detalle}</p>

        {/* Acciones */}
        <button
          type="button"
          onClick={onReintentar}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white text-base mb-3 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#008294" }}
        >
          🔄 Intentar de nuevo
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
        >
          ⬆️ Subir foto en su lugar
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="mt-4 text-xs text-gray-400">
          Si el problema persiste, verifica los permisos en la configuración de tu navegador.
        </p>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export default function Probador() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { agregarAlCarrito } = useCart();

  const productoId = searchParams.get('productoId');
  const producto = todosProd.find(p => p.id === productoId) || null;

  const [fase, setFase] = useState("modal"); // "modal" | "camara" | "foto"
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errorCamara, setErrorCamara] = useState(null); // null | { titulo, detalle, tipo }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);
  const iniciarCamara = useCallback(async () => {
    setFase("camara");
    setErrorCamara(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamaraActiva(true);
    } catch (err) {
      setCamaraActiva(false);
      // Detectar tipo de error específico
      const name = err?.name || "";
      let errorType = "desconocido";

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        errorType = "permisos";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        errorType = "no-encontrada";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        errorType = "en-uso";
      } else if (name === "OverconstrainedError") {
        errorType = "configuracion";
      }

      setErrorCamara({ tipo: errorType, ...cameraErrorDefinitions[errorType] });
    }
  }, []);

  /* Detiene cámara al desmontar o cambiar fase */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  /* Maneja foto subida */
  const handleSubirFoto = (file) => {
    const url = URL.createObjectURL(file);
    setFotoUrl(url);
    // Detener cámara si estaba activa
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamaraActiva(false);
    setFase("foto");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const volverAlModal = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamaraActiva(false);
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setFotoUrl(null);
    setFase("modal");
  };

  /* Sin producto seleccionado */
  if (!producto) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4"><IconGafas size={56} color="#008294" /></div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Probador Virtual</h1>
        <p className="mb-8 text-gray-600">
          Selecciona una montura en el catálogo y pulsa <strong>Probar simulador</strong> para verla en tu rostro.
        </p>
        <Link
          href="/probador-landing"
          className="rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#008294" }}
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── Modal de bienvenida ── */}
      {fase === "modal" && (
        <ModalBienvenida
          producto={producto}
          onTomarFoto={iniciarCamara}
          onSubirFoto={handleSubirFoto}
          onCerrar={() => router.back()}
        />
      )}

      {/* ── Vista principal del probador ── */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Si hay una foto, mostramos la nueva sección de producto destacado */}
        {fase === "foto" && fotoUrl && (
          <ProductoDestacado productoInicial={producto} imagenUsuario={fotoUrl} />
        )}
      </div>
    </>
  );
}
