"use client";

import PropTypes from "prop-types";
import { CartProvider } from "./context/CartContextType";

export default function Providers({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
};