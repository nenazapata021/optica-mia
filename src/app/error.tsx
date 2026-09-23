"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Algo salió mal</h1>
      <p className="mt-2 text-sm text-gray-500">{error.message || "Recarga la página."}</p>
      <button onClick={() => reset()} className="mt-6 rounded-full bg-[#008294] px-6 py-3 text-sm font-semibold text-white">Reintentar</button>
    </main>
  );
}
