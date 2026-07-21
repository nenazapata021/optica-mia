export interface ProductoData {
  id: string;
  name: string;
  price: number;
  categoria: string;
  descripcion: string;
  color?: string;
}

const productos: ProductoData[] = [];

export async function getProductos(): Promise<ProductoData[]> {
  return productos;
}

export async function createProducto(data: Omit<ProductoData, 'id'>): Promise<ProductoData> {
  const producto = { id: String(Date.now()), ...data };
  productos.push(producto);
  return producto;
}
