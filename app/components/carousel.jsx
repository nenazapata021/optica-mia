import React from 'react';
// Importa los componentes y módulos de Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Importa los estilos de Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Importa las imágenes que se usarán en el carrusel
import foto1 from '../assets/foto1.jpg';
import foto2 from '../assets/foto2.jpg';
import foto3 from '../assets/foto3.jpg';
import foto4 from '../assets/foto4.jpg';
import foto5 from '../assets/foto5.jpg';
import foto6 from '../assets/foto6.jpg';

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
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
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
          768: { slidesPerView: 2, spaceBetween: 40 },
          1024: { slidesPerView: 3, spaceBetween: 50 },
        }}
        className="mySwiper w-full h-full"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index} className="rounded-lg overflow-hidden shadow-lg hover-scale transition-transform duration-300">
            <image src={image.src} alt={image.alt} className="w-full h-64 object-cover" />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}