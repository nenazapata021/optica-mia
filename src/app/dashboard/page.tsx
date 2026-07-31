"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { productosLentes, productosGafasSol } from "../data/productos";
import { ShoppingCart, Package, Sun, Eye, Trash2, BarChart3, Table, ClipboardList, Mail, LogOut } from "lucide-react";
import Logo from "../components/Logo";

const AUTH_KEY = "optica-mia-auth";

interface Order {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  date: string;
  customer: string;
}

type Tab = "stats" | "products" | "orders";

const NAV_ITEMS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "stats", label: "Estadísticas", icon: BarChart3 },
  { key: "products", label: "Productos", icon: Table },
  { key: "orders", label: "Pedidos", icon: ClipboardList },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const saved = localStorage.getItem("optica-mia-orders");
      if (saved && cart.length > 0) return JSON.parse(saved);
    }
    return [];
  });
  const [customProducts, setCustomProducts] = useState<Record<string, { nombre: string; precio: number; color: string; categoria: string }>>(() => {
    if (typeof window !== "undefined") {
      const savedProducts = localStorage.getItem("optica-mia-custom-products");
      if (savedProducts) return JSON.parse(savedProducts);
    }
    return {};
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", precio: "", color: "", categoria: "lentes" });
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Correo no autorizado");
        return;
      }
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab === "orders") {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const saved = localStorage.getItem("optica-mia-orders");
      if (saved && cart.length > 0) setOrders(JSON.parse(saved));
      else { setOrders([]); localStorage.removeItem("optica-mia-orders"); }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    router.push("/");
  };

  useEffect(() => {
    localStorage.setItem("optica-mia-custom-products", JSON.stringify(customProducts));
  }, [customProducts]);

  const allProducts = [
    ...productosLentes.map((p) => ({ ...p, categoria: "lentes" })),
    ...productosGafasSol.map((p) => ({ ...p, categoria: "sol" })),
  ];

  const getProductName = (p: { id: string; nombre: string }) =>
    customProducts[p.id]?.nombre ?? p.nombre;

  const getProductPrice = (p: { id: string; precio: number }) =>
    customProducts[p.id]?.precio ?? p.precio;

  const getProductColor = (p: { id: string; color: string }) =>
    customProducts[p.id]?.color ?? p.color;

  const saveProduct = () => {
    if (!editingId) return;
    const updated = { ...customProducts };
    updated[editingId] = {
      nombre: form.nombre,
      precio: Number(form.precio),
      color: form.color,
      categoria: form.categoria,
    };
    setCustomProducts(updated);
    setEditingId(null);
    setForm({ nombre: "", precio: "", color: "", categoria: "lentes" });
  };

  const resetProduct = (id: string) => {
    const updated = { ...customProducts };
    delete updated[id];
    setCustomProducts(updated);
  };

  const startEdit = (p: { id: string; nombre: string; precio: number; color: string; categoria: string }) => {
    setEditingId(p.id);
    const overridden = customProducts[p.id];
    setForm({
      nombre: overridden?.nombre ?? p.nombre,
      precio: String(overridden?.precio ?? p.precio),
      color: overridden?.color ?? p.color,
      categoria: overridden?.categoria ?? p.categoria,
    });
  };

  const COLOR_MAP: Record<string, string> = {
  Negro: "#1a1a1a",
  Plata: "#C0C0C0",
  Dorado: "#D4AF37",
  Plateado: "#A8A9AD",
  Cobre: "#B87333",
  Rojo: "#C0392B",
  Azul: "#2980B9",
  Blanco: "#F5F5F5",
  Miel: "#D4A017",
  Carey: "#C4A882",
  Transparente: "#E8E8E8",
  Rosa: "#FFB6C1",
  "Azul claro": "#87CEEB",
  Grafito: "#4a4a4a",
  Personalizado: "#888888",
};

function colorToHex(color: string): string {
  if (isValidHex(color)) return color;
  const trimmed = color.trim();
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (key.toLowerCase() === lower) return hex;
  }
  const parts = trimmed.split("/").map((c) => c.trim());
  for (const part of parts) {
    if (COLOR_MAP[part]) return COLOR_MAP[part];
  }
  return "#cccccc";
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function hexToColorName(hex: string): string {
  const entry = Object.entries(COLOR_MAP).find(([, v]) => v.toLowerCase() === hex.toLowerCase());
  return entry ? entry[0] : hex;
}

const formatPrice = (n: number) => `$${n.toLocaleString("es-CO")}`;

  const stats = [
    {
      label: "Total Productos",
      value: allProducts.length,
      icon: Package,
      color: "bg-[#008294]",
    },
    {
      label: "Lentes",
      value: allProducts.filter((p) => p.categoria === "lentes").length,
      icon: Eye,
      color: "bg-[#D4AF37]",
    },
    {
      label: "Gafas de Sol",
      value: allProducts.filter((p) => p.categoria === "sol").length,
      icon: Sun,
      color: "bg-amber-600",
    },
    {
      label: "Pedidos",
      value: orders.length,
      icon: ShoppingCart,
      color: "bg-emerald-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!authed ? (
        <div className="flex w-full items-center justify-center px-4">
          <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37]">
                <Mail size={28} className="text-[#D4AF37]" />
              </div>
            </div>
            <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">Acceso Administrador</h1>
            <p className="mb-6 text-center text-sm text-gray-500">Ingresa el correo autorizado para continuar</p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@ejemplo.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              autoFocus
              disabled={loading}
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E] disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>
        </div>
      ) : (
        <Fragment>
      <aside className="flex w-16 flex-col items-center gap-6 border-r border-gray-200 bg-white py-6 shadow-sm md:w-20 lg:w-64 lg:items-start lg:px-4">
          <div className="flex w-full justify-center lg:justify-start lg:px-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-black">
            <Logo size={40} />
          </div>
        </div>
        <nav className="flex w-full flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition md:justify-center lg:justify-start ${
                tab === item.key
                  ? "bg-[#008294]/10 text-[#008294]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <item.icon size={20} />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500 md:justify-center lg:justify-start"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            <span className="hidden lg:inline">Salir</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 overflow-x-auto">
        <div className="bg-[#008294] px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-[#C39A3C]">Panel de administración</p>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          {tab === "stats" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color} text-white`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "products" && (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      {editingId === p.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              value={form.nombre}
                              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </td>
                           <td className="px-4 py-3">
                             <div className="flex items-center gap-2">
                               <input
                                 type="color"
                                 value={isValidHex(form.color) ? form.color : "#000000"}
                                 onChange={(e) => setForm({ ...form, color: hexToColorName(e.target.value) })}
                                 className="h-8 w-8 rounded border border-gray-300 cursor-pointer p-0"
                                 title="Seleccionar color"
                               />
                               <input
                                 value={form.color}
                                 onChange={(e) => setForm({ ...form, color: e.target.value })}
                                 className="flex-1 rounded border px-2 py-1 text-sm"
                               />
                             </div>
                           </td>
                          <td className="px-4 py-3">
                            <select
                              value={form.categoria}
                              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                              className="rounded border px-2 py-1 text-sm"
                            >
                              <option value="lentes">Lentes</option>
                              <option value="sol">Gafas de Sol</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={form.precio}
                              onChange={(e) => setForm({ ...form, precio: e.target.value })}
                              className="w-28 rounded border px-2 py-1 text-sm"
                              type="number"
                            />
                          </td>
                          <td className="flex gap-2 px-4 py-3">
                            <button
                              onClick={saveProduct}
                              className="rounded bg-[#008294] px-3 py-1 text-xs font-medium text-white hover:bg-[#005f6b]"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                            >
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {getProductName(p)}
                            {customProducts[p.id] && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                                editado
                              </span>
                            )}
                          </td>
                           <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                             <span
                               className="inline-block h-4 w-4 rounded-full border border-gray-300"
                               style={{ backgroundColor: colorToHex(getProductColor(p)) }}
                               title={getProductColor(p)}
                             />
                             {getProductColor(p)}
                           </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.categoria === "lentes" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {p.categoria === "lentes" ? "Lentes" : "Gafas de Sol"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatPrice(getProductPrice(p))}
                          </td>
                          <td className="flex gap-2 px-4 py-3">
                            <button
                              onClick={() => startEdit(p)}
                              className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                            >
                              Editar
                            </button>
                            {customProducts[p.id] && (
                              <button
                                onClick={() => resetProduct(p.id)}
                                className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "orders" && (
            <div>
              {orders.length === 0 ? (
                <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                  <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No hay pedidos aún</p>
                  <p className="text-sm text-gray-400">Los pedidos aparecerán aquí cuando los clientes realicen compras.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={order.id} className="rounded-xl bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Pedido #{idx + 1}</p>
                          <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString("es-CO")}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-gray-500">
                            <th className="py-1 text-left font-medium">Producto</th>
                            <th className="py-1 text-center font-medium">Cant</th>
                            <th className="py-1 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-1 text-gray-700">{item.name}</td>
                              <td className="py-1 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-1 text-right font-medium text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </Fragment>
      )}
    </div>
  );
}
