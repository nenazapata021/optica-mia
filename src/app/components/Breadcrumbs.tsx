"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb { label: string; href?: string; }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-2 py-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-[#008294] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] rounded">
            <Home size={14} /> Inicio
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-400" />
            {c.href ? (
              <Link href={c.href} className="hover:text-[#008294] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] rounded px-1">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-gray-800 px-1">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
