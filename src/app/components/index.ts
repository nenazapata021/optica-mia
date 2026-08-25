export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen: string; // Se puede refinar más si es necesario
  categoria: 'mujer' | 'hombre' | 'niños' | 'sol';
  color: string;
}