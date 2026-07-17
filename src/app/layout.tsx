import "./globals.css";
import Providers from "./providers";
import Header from "./header/header";
import { type ReactNode } from "react";

export const metadata = {
  title: "Óptica Mia",
  description: "El futuro, a la vista.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers>
          <Header />

          <main className="[flex-grow]">
            {children}
          </main>

          <footer
            className="py-6 text-center text-sm"
            style={{
              backgroundColor: "#008294",
              color: "#C39A3C",
            }}
          >
            © {new Date().getFullYear()} Óptica Mia. Todos los derechos
            reservados.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
