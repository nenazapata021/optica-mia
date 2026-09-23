import ProbadorLanding from "../probadorLanding/probadorLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Probador Virtual de Gafas con IA | Óptica Mía Itagüí",
  description:
    "Prueba 28 monturas en tu rostro al instante con IA. Filtra por mujer, hombre, niños y sol. Probador pensado para móvil. ¡Sin salir de casa!",
  alternates: { canonical: "/probador-landing" },
  openGraph: { title: "Probador Virtual IA | Óptica Mía", description: "Mira cómo te quedan las gafas con IA antes de comprar.", url: "/probador-landing", type: "website" },
};

export default function ProbadorLandingPage() {
  return <ProbadorLanding />;
}
