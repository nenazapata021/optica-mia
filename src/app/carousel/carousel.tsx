'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules'; // 💡 Quitamos EffectFade
import Image from 'next/image';

// Importa los estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// 💡 Quitamos el estilo de effect-fade que ya no usaremos

// Importa las imágenes que se usarán en el carrusel
import foto1 from '../assets/foto1-sin-fondo.png';
import foto2 from '../assets/foto2-sin-fondo.png';
import foto3 from '../assets/foto3-sin-fondo.png';
import foto4 from '../assets/foto4-sin-fondo.png';
import foto5 from '../assets/foto5-sin-fondo.png';
import foto6 from '../assets/foto6-sin-fondo.png';

// Un pequeño CSS para asegurar que la paginación y navegación se vean bien con Tailwind
const customStyles = `
.swiper-pagination-bullet-active {
  background-color: #008294 !important;
}
.swiper-button-next,
.swiper-button-prev {
  color: #008294 !important;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 9999px;
  width: 40px !important;
  height: 40px !important;
  transform: translateY(-50%);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.swiper-button-next::after,
.swiper-button-prev::after {
  font-size: 20px !important;
  font-weight: bold;
}
`;

const images = [
  { src: foto1, alt: 'Gafas modelo 1' },
  { src: foto2, alt: 'Gafas modelo 2' },
  { src: foto3, alt: 'Gafas modelo 3' },
  { src: foto4, alt: 'Gafas modelo 4' },
  { src: foto5, alt: 'Gafas modelo 5' },
  { src: foto6, alt: 'Gafas modelo 6' },
];

export default function Carousel() {
  return (
    <>
      <style>{customStyles}</style>
      <div className="w-full max-w-6xl mx-auto px-4 py-8"> {/* Contenedor para centrar y dar margen */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]} // 💡 Sin EffectFade
          spaceBetween={24} // Espacio exacto entre las tarjetas de gafas
          slidesPerView={1} // 1 foto por defecto en celulares
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
          }}
          navigation={true}
          breakpoints={{
            // 💡 Cuando la pantalla sea grande (computadoras), muestra 3 imágenes a la vez
            768: {
              slidesPerView: 3,
            },
          }}
          className="mySwiper w-full"
        >
          {images.map((image, index) => (
          <SwiperSlide key={index} className="group rounded-lg overflow-hidden shadow-lg">
            <div className="relative h-64 w-full">
              <Image fill src={image.src} alt={image.alt} className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
          </SwiperSlide>
        ))}
        </Swiper>
      </div>
    </>
  );
}