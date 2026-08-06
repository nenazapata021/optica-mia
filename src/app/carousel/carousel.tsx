'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
  { src: '/monturas/foto1.png', alt: 'Montura Agatada 8306' },
  { src: '/monturas/foto2.png', alt: 'Montura Agatada 24028' },
  { src: '/monturas/foto3.png', alt: 'Montura Vintage 6019' },
  { src: '/monturas/foto4.png', alt: 'Montura Ovalada Volt' },
  { src: '/monturas/foto5.png', alt: 'Montura Agatada Retro' },
  { src: '/monturas/foto6.png', alt: 'Montura Agatada Retro' },
];

export default function Carousel() {
  return (
    <>
      <style>{customStyles}</style>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
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
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
          }}
          className="mySwiper w-full"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index} className="group rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-64 w-full bg-gray-50 flex items-center justify-center">
                <Image
                  fill
                  src={image.src}
                  alt={image.alt}
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}
