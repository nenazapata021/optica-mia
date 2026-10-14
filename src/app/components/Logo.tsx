import logoOpticaMia from "../assets/logos/Logo-optica-mia-original.jpg";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 48, className = "" }: LogoProps) {
  const dimensions = size ? `${size}px` : "auto";
  return (
    <img
      src={logoOpticaMia.src}
      alt="Óptica Mía"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: dimensions, height: dimensions }}
    />
  );
}
