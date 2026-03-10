// lib/serverImages.ts
// Avec Cellar, les URLs sont des URLs publiques directes.
// Cette lib garde la compatibilité pour le flow StoreHydration.

export async function saveImageToServer(key: string, dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, dataUrl }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      console.error(`[serverImages] Échec upload key="${key}":`, json.error ?? res.status);
      return null;
    }
    // Retourner l'URL B2 publique si disponible
    return json.url ?? null;
  } catch (e) {
    console.error(`[serverImages] Erreur réseau key="${key}":`, e);
    return null;
  }
}

export async function getImageFromServer(key: string): Promise<string | null> {
  try {
    const res  = await fetch(`/api/images?key=${encodeURIComponent(key)}`);
    const json = await res.json();
    return json?.ok && json?.data ? json.data : null;
  } catch (e) {
    console.warn("[serverImages] getImageFromServer failed:", e);
    return null;
  }
}
