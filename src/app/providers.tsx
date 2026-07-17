"use client";

import { type ReactNode } from "react";
import { CartProvider } from "./context/CartContextType";
import { FavoritesProvider } from "./context/FavoritesContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </CartProvider>
  );
}
