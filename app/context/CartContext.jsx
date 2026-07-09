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
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('opticamia_cart')) || [];
  });

  useEffect(() => {
    localStorage.setItem('opticamia_cart', JSON.stringify(cart));
  }, [cart]);

  const agregarAlCarrito = (producto, opciones = {}) => {
    const { silencioso = false } = opciones;

    setCart((prevCart) => {
      const itemExistente = prevCart.find((item) => item.id === producto.id);
      if (itemExistente) {
        return prevCart.map((item) =>
          item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...producto, quantity: 1 }];
    });

    if (!silencioso) {
      alert(`${producto.nombre} agregado al carrito 🛒`);
    }
  };

  const incrementarCantidad = (id) => {
    setCart(prevCart =>
      prevCart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
    );
  };

  const decrementarCantidad = (id) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === id) {
          return item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const eliminarProducto = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0),
  [cart]);
  const totalDinero = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0),
  [cart]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      agregarAlCarrito, 
      incrementarCantidad, 
      decrementarCantidad, 
      eliminarProducto,
      totalItems,
      totalDinero
    }}>
      {children}
    </CartContext.Provider>
  );
}