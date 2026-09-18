"use client";

export interface WhatsAppOrderData {
  products: string[];
  quantities: number[];
  total: number;
  customerName: string;
  paymentMethod: "ADDI" | "SISTECREDITO";
}

interface WhatsAppCheckoutButtonProps {
  orderData: WhatsAppOrderData;
  onBack?: () => void;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573017391219";

function buildWhatsAppMessage(data: WhatsAppOrderData): string {
  const metodo = data.paymentMethod === "ADDI" ? "Addi" : "Sistecredito";
  const productLines = data.products
    .map((product, i) => `- ${product} x${data.quantities[i] || 1}`)
    .join("\n");

  return (
    `Hola, quiero comprar con ${metodo}.\n` +
    `Cliente: ${data.customerName}\n` +
    `Productos:\n${productLines}\n` +
    `Total: $${data.total.toLocaleString("es-CO")}`
  );
}

export default function WhatsAppCheckoutButton({
  orderData,
  onBack,
}: WhatsAppCheckoutButtonProps) {
  const message = buildWhatsAppMessage(orderData);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div className="rounded-2xl border border-[#005f6b]/20 bg-[#f0fdfa] p-6">
      <h3 className="mb-1 text-xl font-bold text-[#005f6b]">
        Finaliza tu compra por WhatsApp
      </h3>
      <p className="mb-5 text-sm text-gray-600">
        Para finalizar tu compra con {orderData.paymentMethod === "ADDI" ? "Addi" : "Sistecredito"},
        un asesor te atenderá por WhatsApp.
      </p>

      <div className="mb-5 rounded-xl bg-white p-4 shadow-sm">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Resumen del pedido</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {orderData.products.map((product, i) => (
            <li key={i}>
              - {product} x{orderData.quantities[i] || 1}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-bold text-[#005f6b]">
          Total: ${orderData.total.toLocaleString("es-CO")}
        </p>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20BD5C]"
      >
        <svg viewBox="0 0 24 24" fill="#ffffff" width="20" height="20" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Continúa en WhatsApp
      </a>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm font-medium text-gray-500 underline hover:text-gray-700"
        >
          Volver
        </button>
      )}
    </div>
  );
}
