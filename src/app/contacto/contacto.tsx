"use client";

import Image from "next/image";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/opticamia.virtual/",
    logo: "/social-logos/instagram.jpg",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@opticamia.virtual?si=tOrHd7o_i0dEKEvp",
    logo: "/social-logos/youtube.jpg",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@opticamia.virtual?_r=1&_t=ZS-98bq2OaQOmb",
    logo: "/social-logos/tiktok.jpg",
  },
];

export default function Contacto() {
  return (
    <section id="contacto" className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 sm:p-8 md:p-12">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Contáctanos
        </h2>

        <p className="mt-3 text-sm text-slate-600 sm:mt-4 sm:text-base">
          El futuro, a la vista.
        </p>

        <div className="mt-6 flex justify-center items-center gap-4 sm:mt-8 sm:gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full overflow-hidden transition-transform hover:scale-110"
            >
              <Image
                src={link.logo}
                alt={link.name}
                width={48}
                height={48}
                className="h-12 w-12 sm:h-[60px] sm:w-[60px]"
                priority
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}