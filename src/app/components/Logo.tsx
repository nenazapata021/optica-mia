import Image from "next/image";
import logoOpticaMia from "../assets/logos/optica-mia.jpeg";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 48, className = "" }: LogoProps) {
  return (
    <Image
      src={logoOpticaMia}
      alt="Óptica Mía"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
