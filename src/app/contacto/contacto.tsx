"use client";

import Image from "next/image";
import instagramLogo from "../assets/instagram.jpg";

export default function Contacto() {
  return (
    <section id="contacto" className="px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-lg transition-transform duration-300 hover:scale-105 md:p-12">
        <h2 className="text-3xl font-bold">
          Contáctanos
        </h2>

        <p className="mt-4 text-slate-600">
          El futuro, a la vista.
        </p>

        <div className="mt-8 flex justify-center items-center gap-6">
          <a
            href="https://www.instagram.com/opticamia.virtual/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full overflow-hidden transition-transform hover:scale-110"
          >

            <Image
              src={instagramLogo}
              alt="Instagram"
              width={60}
              height={60}
              priority
            />
          </a>
        </div>
      </div>
    </section>
  );
}