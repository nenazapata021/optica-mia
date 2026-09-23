"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs, FreeMode, A11y, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { type ProductImageDTO } from "../types/producto";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

interface ProductGalleryProps {
  images: ProductImageDTO[];
  productName: string;
  className?: string;
}

const galleryStyles = `
.pg-bullet {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #cbd5e1;
  opacity: 1;
  transition: all 0.2s;
}
.pg-bullet-active {
  background: #008294 !important;
  width: 24px !important;
  border-radius: 9999px;
}
.pg-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  color: #334155;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  transition: all 0.2s;
}
.pg-nav-btn:hover { background: white; transform: translateY(-50%) scale(1.05); }
.pg-nav-btn:disabled { opacity: 0.35; pointer-events: none; }
`;

function getImageSrc(url: string | StaticImageData): string | StaticImageData {
  return url;
}

export default function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white ${className ?? ""}`}>
        <div className="flex h-full items-center justify-center text-sm text-slate-400">Sin imágenes</div>
      </div>
    );
  }

  const showControls = images.length > 1;

  return (
    <>
      <style>{galleryStyles}</style>
      <div className={`flex flex-col gap-3 ${className ?? ""}`}>
        {/* Carrusel principal */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
          <Swiper
            onSwiper={setMainSwiper}
            modules={[Navigation, Pagination, Thumbs, FreeMode, A11y, Keyboard]}
            spaceBetween={0}
            slidesPerView={1}
            loop={showControls}
            keyboard={{ enabled: true }}
            a11y={{
              prevSlideMessage: "Imagen anterior",
              nextSlideMessage: "Siguiente imagen",
            }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            pagination={
              showControls
                ? {
                    clickable: true,
                    bulletClass: "pg-bullet",
                    bulletActiveClass: "pg-bullet-active",
                  }
                : false
            }
            navigation={
              showControls
                ? { prevEl: ".pg-prev", nextEl: ".pg-next" }
                : false
            }
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="h-full w-full"
            aria-label={`Galería de ${productName}`}
          >
            {images.map((img, idx) => (
              <SwiperSlide key={`${String(img.url)}-${idx}`} className="h-full w-full">
                <div className="relative h-full w-full bg-white">
                  <Image
                    src={getImageSrc(img.url)}
                    alt={img.alt || `${productName} - ${img.angle} ${idx + 1}/${images.length}`}
                    fill
                    priority={idx === 0}
                    loading={idx === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-contain p-2"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {showControls && (
            <>
              <button
                type="button"
                className="pg-nav-btn pg-prev left-3"
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="pg-nav-btn pg-next right-3"
                aria-label="Siguiente imagen"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Thumbnails + dots fallback */}
        {showControls && (
          <div className="flex flex-col gap-2">
            {/* Thumbnails Swiper */}
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[FreeMode, Thumbs, A11y]}
              spaceBetween={8}
              slidesPerView="auto"
              freeMode
              watchSlidesProgress
              className="w-full !pb-1"
              aria-label="Miniaturas"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={`thumb-${String(img.url)}-${idx}`} className="!w-16 !h-16 sm:!w-20 sm:!h-20">
                  <button
                    type="button"
                    onClick={() => {
                      if (mainSwiper) {
                        if (mainSwiper.params.loop) mainSwiper.slideToLoop(idx);
                        else mainSwiper.slideTo(idx);
                      }
                      setActiveIndex(idx);
                    }}
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      activeIndex === idx
                        ? "border-[#008294] ring-2 ring-[#008294]/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    aria-label={`Ver ${img.alt || img.angle} - imagen ${idx + 1} de ${images.length}`}
                    aria-selected={activeIndex === idx}
                    role="tab"
                  >
                    <Image
                      src={getImageSrc(img.url)}
                      alt={img.alt || `Miniatura ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain bg-white p-1"
                      loading="lazy"
                    />
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Etiqueta ángulo activo — ayuda visual que hay múltiples vistas */}
            <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500">
              {images[activeIndex]?.angle.replace("_", " ") ?? ""} · {activeIndex + 1} / {images.length}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
