"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Producto } from "../types/producto";

interface FavoritesContextType {
  favorites: Producto[];
  toggleFavorite: (producto: Producto) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites debe ser usado dentro de un FavoritesProvider");
  }
  return context;
};

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Producto[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("optica-mia-favorites");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(JSON.parse(stored) as Producto[]);
      }
    } catch {
      console.error("Error al cargar favoritos desde localStorage");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("optica-mia-favorites", JSON.stringify(favorites));
    } catch {
      console.error("Error al guardar favoritos en localStorage");
    }
  }, [favorites]);

  const toggleFavorite = useCallback((producto: Producto) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => p.id === producto.id);
      if (exists) {
        return prev.filter((p) => p.id !== producto.id);
      }
      return [...prev, producto];
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((p) => p.id === id),
    [favorites],
  );

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite }),
    [favorites, toggleFavorite, isFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}