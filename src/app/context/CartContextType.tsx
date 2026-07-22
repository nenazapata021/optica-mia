"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { type Producto } from "../types/producto";

// 1. Definir la interfaz para un item en el carrito
export interface CartItem extends Producto {
  quantity: number;
}

// 2. Definir la interfaz para el valor del contexto
export interface CartContextType {
  cartItems: CartItem[];
  totalPrice: number;
  totalItems: number;
  addToCart: (producto: Producto) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
}

// 3. Crear el contexto con un valor inicial undefined
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Crear el hook `useCart` para consumir el contexto de forma segura
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};

// 5. Crear el componente Provider que contendrá toda la lógica
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cargar el carrito desde localStorage solo en el cliente
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Error al cargar el carrito desde localStorage", error);
    }
  }, []);

  // Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error al guardar el carrito en localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (producto: Producto) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === producto.id);
      if (existingItem) {
        // Si ya existe, incrementa la cantidad
        return prevItems.map((item) =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Si no existe, lo añade con cantidad 1
      return [...prevItems, { ...producto, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    const orders = JSON.parse(localStorage.getItem("optica-mia-orders") || "[]");
    const filtered = orders.filter((o: any) =>
      !o.items.some((i: any) => i.productId === id)
    );
    localStorage.setItem("optica-mia-orders", JSON.stringify(filtered));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("optica-mia-orders");
  };

  const updateQuantity = (id: string, amount: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      )
    );
  };

  const increaseQuantity = (id: string) => updateQuantity(id, 1);
  const decreaseQuantity = (id: string) => updateQuantity(id, -1);

  // Usamos useMemo para evitar cálculos innecesarios en cada render
  const totalItems = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    totalPrice,
    totalItems,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}