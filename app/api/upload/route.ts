// app/api/upload/route.ts
// Reçoit un fichier image, l'uploade sur Backblaze B2 et retourne l'URL publique.
// Plus de base64 dans MySQL — les images sont servies directement depuis B2/CDN.

export const dynamic   = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { uploadToB2, b2Key } from "@/lib/backblaze";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const form   = await req.formData();
    const file   = form.get("file") as File | null;
    const keyHint = (form.get("key") as string | null) ?? `misc/${nanoid(8)}`;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Fichier manquant" }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/webp";
    const ext      = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";

    // Clé B2 : woodiz/product/42.webp, woodiz/slider/0.avif, etc.
    const key = keyHint.includes("/")
      ? `woodiz/${keyHint}.${ext}`
      : b2Key(keyHint, nanoid(6), ext);

    const publicUrl = await uploadToB2(key, buffer, mimeType);

    return NextResponse.json({ ok: true, url: publicUrl, key });
  } catch (err) {
    console.error("[upload] Erreur:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
