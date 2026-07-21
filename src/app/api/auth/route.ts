import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ ok: true, data });
}
