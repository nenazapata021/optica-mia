"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export default function ProductImageCarousel({
  images,
  alt,
  className,
}: ProductImageCarouselProps) {
  const count = images.length;
  const [index, setIndex] = useState(0);

  if (count === 0) {
    return (
      <div
        className={`relative w-full aspect-[7/6] overflow-hidden rounded-xl bg-[#f5f5f5] flex items-center justify-center ${className ?? ""}`}
      >
        <span className="text-sm text-slate-400">Sin imágenes</span>
      </div>
    );
  }

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  return (
    <div
      className={`relative w-full aspect-[7/6] overflow-hidden rounded-xl bg-[#f5f5f5] ${className ?? ""}`}
    >
      {/* Imagen actual con transición fade entre cambios */}
      <div
        key={index}
        className="absolute inset-0"
        style={{ animation: "pia-fade 0.2s ease" }}
      >
        <Image
          src={images[index]}
          alt={`${alt} - imagen ${index + 1} de ${count}`}
          fill
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-4"
        />
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Imagen anterior"
            className="absolute left-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition hover:scale-105"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Siguiente imagen"
            className="absolute right-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition hover:scale-105"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
