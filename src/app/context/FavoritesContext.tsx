"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Producto } from "../types/producto";
import { useAuth } from "./AuthContext";

const LS_KEY = "optica-mia-favorites";

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

function loadLocalFavorites(): Producto[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? (JSON.parse(stored) as Producto[]) : [];
  } catch {
    return [];
  }
}

function saveLocalFavorites(favorites: Producto[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(favorites));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Producto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(loadLocalFavorites());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || authLoading || !user) return;
    fetch("/api/favorites")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (data.favorites) {
          const apiProducts = data.favorites.map((f: { product: Producto }) => f.product);
          setFavorites((prev) => {
            const merged = new Map<string, Producto>();
            apiProducts.forEach((p: Producto) => merged.set(p.id, p));
            prev.forEach((p: Producto) => {
              if (!merged.has(p.id)) {
                merged.set(p.id, p);
              }
            });
            const result = Array.from(merged.values());
            saveLocalFavorites(result);
            return result;
          });
        }
      })
      .catch(() => {});
  }, [user, loaded, authLoading]);

  const toggleFavorite = useCallback(async (producto: Producto) => {
    if (!user) {
      setFavorites((prev) => {
        const exists = prev.find((p) => p.id === producto.id);
        const next = exists ? prev.filter((p) => p.id !== producto.id) : [...prev, producto];
        saveLocalFavorites(next);
        return next;
      });
      return;
    }

    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === producto.id);
      const next = exists ? prev.filter((p) => p.id !== producto.id) : [...prev, producto];
      saveLocalFavorites(next);
      return next;
    });

    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: producto.id }),
    }).catch(() => {});
  }, [user]);

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