"use client";

import { useFavorites } from "../context/FavoritesContext";
import Catalogo from "../catalogo/catalogo";

export default function FavoritasPage() {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Mis Favoritas</h1>
        <p className="text-slate-500">
          Aún no tienes monturas favoritas. Explora y dale corazón a las que más te gusten.
        </p>
      </div>
    );
  }

  return (
    <Catalogo
      titulo="Mis Favoritas"
      descripcion={`Tienes ${favorites.length} montura${favorites.length !== 1 ? "s" : ""} guardada${favorites.length !== 1 ? "s" : ""}.`}
      listaProductos={favorites}
    />
  );
}
