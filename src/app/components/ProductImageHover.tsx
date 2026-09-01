"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";

interface ProductImageHoverProps {
  imageFront: string | StaticImageData;
  imageSide?: string | StaticImageData;
  alt: string;
  className?: string;
}

function toSrc(url: string | StaticImageData): string {
  return typeof url === "string" ? url : url.src;
}

export default function ProductImageHover({
  imageFront,
  imageSide,
  alt,
  className,
}: ProductImageHoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const frontSrc = toSrc(imageFront);
  const sideSrc = imageSide ? toSrc(imageSide) : null;
  const hasSideImage = Boolean(sideSrc && sideSrc !== frontSrc);

  useEffect(() => {
    if (!hasSideImage || !sideSrc) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = sideSrc;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [sideSrc, hasSideImage]);

  const showSide = !isMobile && hasSideImage && isHovered;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#f5f5f5] ${className ?? "w-full aspect-[4/3]"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={alt}
    >
      <Image
        src={frontSrc}
        alt={`${alt} - Vista frontal`}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`
          object-contain p-4 transition-opacity duration-300 ease-in-out
          ${showSide ? "opacity-0" : "opacity-100"}
        `}
      />
      {hasSideImage && sideSrc && (
        <Image
          src={sideSrc}
          alt={`${alt} - Vista lateral`}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 33vw"
          className={`
            object-contain p-4 transition-opacity duration-300 ease-in-out
            ${showSide ? "opacity-100" : "opacity-0"}
          `}
        />
      )}
    </div>
  );
}