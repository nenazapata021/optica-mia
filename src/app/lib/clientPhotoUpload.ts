/**
 * Upload ya procesado 1024x1024 PNG a PostgreSQL (tabla client_photos = bucket "client-photos").
 * Reintento automático 1 vez + mensaje específico.
 */
export async function uploadClientPhoto(blob: Blob, customerId: string): Promise<string> {
  if (!customerId) throw new Error("Debes iniciar sesión para subir tu foto.");

  const doUpload = async (): Promise<string> => {
    const form = new FormData();
    form.append("file", blob, "photo.png");
    form.append("customerId", customerId);

    const res = await fetch("/api/client-photos", {
      method: "POST",
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "No se pudo guardar tu foto. Intenta de nuevo.");
    }

    if (!data.url) throw new Error("Respuesta inválida del servidor.");
    return data.url as string;
  };

  try {
    return await doUpload();
  } catch (e) {
    // Reintento 1 vez
    try {
      await new Promise((r) => setTimeout(r, 600));
      return await doUpload();
    } catch (e2) {
      throw e2 instanceof Error ? e2 : (e as Error);
    }
  }
}
