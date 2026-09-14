import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { cartItems, customerData } = await req.json();

  // Monto SIEMPRE calculado en el servidor, nunca desde el frontend
  let totalCents = 0;
  for (const item of cartItems) {
    const producto = await prisma.product.findUnique({ where: { id: item.id } });
    if (!producto) {
      return Response.json({ error: `Producto ${item.id} no existe` }, { status: 400 });
    }
    totalCents += producto.price * 100 * item.cantidad;
  }

  const referencia = `OPM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const orden = await prisma.order.create({
    data: {
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerCity: customerData.city,
      paymentReference: referencia,
      totalInCents: totalCents / 100,
      status: "PENDING",
      customer: customerData,
      items: cartItems,
    },
  });

  // Firma de integridad: evita que alguien manipule el monto desde el frontend
  const signatureString = `${referencia}${totalCents}COP${process.env.WOMPI_INTEGRITY_SECRET}`;
  const signature = crypto.createHash("sha256").update(signatureString).digest("hex");

  return Response.json({
    referencia,
    amountInCents: totalCents,
    signature,
    orderId: orden.id,
  });
}