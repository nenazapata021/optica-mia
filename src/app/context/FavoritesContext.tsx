"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Producto } from "../types/producto";

const LS_KEY = "optica-mia-favorites";
const LS_CUSTOMER_KEY = "optica-mia-customer-data";

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

function getCustomerId(): string | null {
  try {
    const data = localStorage.getItem(LS_CUSTOMER_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.id || null;
    }
  } catch {}
  return null;
}

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
  const [favorites, setFavorites] = useState<Producto[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCustomerId(getCustomerId());
    setFavorites(loadLocalFavorites());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !customerId) return;
    fetch(`/api/favorites?customerId=${customerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (data.favorites) {
          const products = data.favorites.map((f: { product: Producto }) => f.product);
          setFavorites(products);
          saveLocalFavorites(products);
        }
      })
      .catch(() => {});
  }, [customerId, loaded]);

  const toggleFavorite = useCallback(async (producto: Producto) => {
    const cid = getCustomerId();
    if (cid) {
      setFavorites((prev) => {
        const exists = prev.some((p) => p.id === producto.id);
        const next = exists ? prev.filter((p) => p.id !== producto.id) : [...prev, producto];
        saveLocalFavorites(next);
        return next;
      });
      fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cid, productId: producto.id }),
      }).catch(() => {});
    } else {
      setFavorites((prev) => {
        const exists = prev.find((p) => p.id === producto.id);
        const next = exists ? prev.filter((p) => p.id !== producto.id) : [...prev, producto];
        saveLocalFavorites(next);
        return next;
      });
    }
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
