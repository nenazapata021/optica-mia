export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen: any; // Se puede refinar más si es necesario
  categoria: 'mujer' | 'hombre' | 'niños' | 'sol';
  color: string;
}