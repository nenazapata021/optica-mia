"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";

interface ProductImageHoverProps {
  imageFront: string | StaticImageData;
  imageSide?: string | StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
  href?: string;
}

function toSrc(url: string | StaticImageData): string {
  return typeof url === "string" ? url : url.src;
}

export default function ProductImageHover({
  imageFront,
  imageSide,
  alt,
  className,
  priority = false,
  href,
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

  const showSide = !isMobile && hasSideImage && isHovered;
  const inner = (
    <>
      <Image
        src={frontSrc}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`object-contain p-4 transition-opacity duration-300 ease-in-out ${showSide ? "opacity-0" : "opacity-100"}`}
      />
      {hasSideImage && sideSrc && (
        <Image
          src={sideSrc}
          alt={`${alt} - Vista lateral`}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 33vw"
          className={`object-contain p-4 transition-opacity duration-300 ease-in-out ${showSide ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#f5f5f5] ${className ?? "w-full aspect-[4/3]"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={href ? undefined : "img"}
      aria-label={href ? undefined : alt}
    >
      {href ? (
        <a href={href} aria-label={alt} className="absolute inset-0">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}