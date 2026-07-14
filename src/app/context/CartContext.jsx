"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

// 1. Crear el Contexto
export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// 2. Crear el Proveedor (Provider)
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("opticamia_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("opticamia_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const agregarAlCarrito = (producto, opciones = {}) => {
    const { silencioso = false } = opciones;

    setCartItems((prevCart) => {
      const itemExistente = prevCart.find((item) => item.id === producto.id);
      if (itemExistente) {
        return prevCart.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevCart, { ...producto, cantidad: 1 }];
    });

    if (!silencioso) {
      alert(`${producto.nombre} agregado al carrito 🛒`);
    }
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    setCartItems((prevCart) => {
      if (nuevaCantidad <= 0) {
        return prevCart.filter((item) => item.id !== id);
      }
      return prevCart.map((item) =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      );
    });
  };

  const eliminarDelCarrito = (id) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const vaciarCarrito = () => {
    setCartItems([]);
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad, 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        agregarAlCarrito,
        actualizarCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
        totalItems,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
