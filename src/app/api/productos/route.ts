import { NextResponse } from "next/server";
import { getProductos } from "../../../services/productoService";

export async function GET() {
  const productos = await getProductos();
  return NextResponse.json({ productos });
}

export async function POST(request: Request) {
  const data = await request.json();
  console.log(data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
