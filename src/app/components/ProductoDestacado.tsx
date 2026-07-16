"use client";

import React, { useState, useEffect } from "react";
import { StaticImageData } from "next/image";
import Image from "next/image" ;
import ProductInfo from './ProductInfo';
import ColeccionCarousel from './ColeccionCarousel';
import { productosLentes, productosGafasSol } from '../data/productos.js';
import { type Producto } from '../types/producto';

// Interfaz para describir la forma de los datos que vienen del archivo .js
interface ProductoJs {
  id: string;
  nombre: string;
  precio: number;
  // La colección importa archivos locales, por lo que Next.js los tipa como
  // StaticImageData. Mantener este tipo alineado con Producto evita asignar
  // una URL de texto a una propiedad que solo acepta imports estáticos.
  imagen: StaticImageData;
  color: string;
}

function transformarProducto(productoJs: ProductoJs, categoria: 'lentes' | 'sol'): Producto {
  return {
    id: productoJs.id,
    name: productoJs.nombre,
    price: productoJs.precio,
    image: productoJs.imagen,
    color: productoJs.color,
    categoria: categoria,
    descripcion: `Montura modelo ${productoJs.nombre}.`,
    modelo: productoJs.id, // Usamos el id como modelo si no existe
  };
}

// Transformamos y combinamos las colecciones de forma segura
const coleccionCompleta: Producto[] = [
  ...(productosLentes as ProductoJs[]).map(p => transformarProducto(p, 'lentes')),
  ...(productosGafasSol as ProductoJs[]).map(p => transformarProducto(p, 'sol')),
];

interface ProductoDestacadoProps {
  productoInicial: Producto;
  imagenUsuario: string | StaticImageData;
}

export default function ProductoDestacado({ productoInicial, imagenUsuario }: ProductoDestacadoProps) {
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>(productoInicial);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductoSeleccionado(productoInicial);
  }, [productoInicial]);

  return (
    <div className="w-full bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Sección Principal de Producto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Columna Izquierda: Imagen */}
          <div className="relative w-full max-w-lg mx-auto aspect-square rounded-2xl shadow-lg border-4 border-[#005f6b] overflow-hidden">
            <Image
              src={imagenUsuario}
              alt="Usuario con montura"
              fill
              className="object-cover"
            />
            <Image
              src={Array.isArray(productoSeleccionado.image) ? productoSeleccionado.image[0] : productoSeleccionado.image}
              alt={productoSeleccionado.name}
              fill
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
