"use client";

import Image from "next/image";
import instagramLogo from "@/public/instagram.jpg";

export default function Contacto() {
  return (
    <section id="contacto" className="px-6 py-20">
      <div className="hover-scale mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-lg md:p-12">
        <h2 className="text-3xl font-bold">
          Contáctanos
        </h2>

        <p className="mt-4 text-slate-600">
          El futuro, a la vista.
        </p>

        <a
          href="https://wa.me/573017391219"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full bg-green-500 px-7 py-3 font-bold text-white transition hover:bg-green-600"
        >
          301 739 1219 - 314 859 0569
        </a>

        <div className="mt-6 flex justify-center">
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