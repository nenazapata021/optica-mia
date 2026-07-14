import React, { useState, useEffect } from 'react';
import ProductInfo from './ProductInfo';
import ColeccionCarousel from './ColeccionCarousel';
import { productosLentes, productosGafasSol } from '../data/productos.js';
import Image from 'next/image';

const coleccionCompleta = [...productosLentes, ...productosGafasSol];

export default function ProductoDestacado({ productoInicial, imagenUsuario }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(productoInicial);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductoSeleccionado(productoInicial);
  }, [productoInicial]);

  return (
    <div className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Sección Principal de Producto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Columna Izquierda: Imagen */}
          <div className="relative w-full max-w-lg mx-auto aspect-square rounded-2xl shadow-lg border-4 border-[#005f6b] overflow-hidden">
            <Image
              src={imagenUsuario}
              alt="Usuario con montura"
              className="w-full h-full object-cover"
            />
            <Image
              src={productoSeleccionado.imagen}
              alt={productoSeleccionado.nombre}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>

          {/* Columna Derecha: Información */}
          <ProductInfo producto={productoSeleccionado} />
        </div>

        {/* Sección de Colección */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800">Explora Nuestra Colección</h3>
        </div>
        <ColeccionCarousel productos={coleccionCompleta} onSelectProduct={setProductoSeleccionado} />
      </div>
    </div>
  );
}