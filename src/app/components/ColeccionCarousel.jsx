import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/navigation';

export default function ColeccionCarousel({ productos, onSelectProduct }) {
  return (
    <div className="w-full px-12 relative">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 3, spaceBetween: 30 },
          1024: { slidesPerView: 4, spaceBetween: 40 },
        }}
        className="mySwiper"
      >
        {productos.map((producto) => (
          <SwiperSlide key={producto.id} onClick={() => onSelectProduct(producto)} className="cursor-pointer group">
            <div className="hover-scale bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="img-zoom-wrap h-32">
                <Image src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{producto.nombre}</h4>
                <p className="text-xs text-gray-500">{producto.categoria}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="swiper-button-prev [after:!text-lg] [!text-gray-500] [!left-0]"></div>
      <div className="swiper-button-next [after:!text-lg] [!text-gray-500] [!right-0]"></div>
    </div>
  );
}