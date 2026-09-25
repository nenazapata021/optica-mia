"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContextType";
import { FavoritesProvider } from "./context/FavoritesContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}