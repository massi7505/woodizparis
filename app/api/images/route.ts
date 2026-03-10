// app/api/images/route.ts
// Avec Cellar, les images sont servies directement via leur URL publique.
// Cette route garde la compatibilité pour les anciennes images encore en MySQL (base64).

export const dynamic   = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql";
import { uploadToB2, b2Key, deleteFromB2 } from "@/lib/backblaze";

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS images (
      img_key    VARCHAR(200) NOT NULL PRIMARY KEY,
      data_url   LONGTEXT     NOT NULL,
      mime_type  VARCHAR(60)  NOT NULL DEFAULT 'image/webp',
      byte_size  INT UNSIGNED NOT NULL DEFAULT 0,
      b2_url     VARCHAR(500),
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_key_prefix (img_key(50))
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `).catch(() => {});
}

/** GET /api/images?key=product:42 — sert l'image (compatibilité anciens __idb:) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ ok: false, error: "key manquant" }, { status: 400 });

    await ensureTable();
    const row = await queryOne<any>(
      "SELECT data_url, mime_type, b2_url FROM images WHERE img_key = ?",
      [key]
    );
    if (!row) return NextResponse.json({ ok: false, data: null });

    // Si l'image a été migrée vers B2, rediriger
    if (row.b2_url) {
      return NextResponse.redirect(row.b2_url, 301);
    }

    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("image/") || accept === "*/*") {
      const base64 = row.data_url?.split(",")?.[1];
      if (base64) {
        const binary = Buffer.from(base64, "base64");
        const mime   = row.mime_type ?? "image/webp";
        return new Response(binary, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return NextResponse.json({ ok: true, data: row.b2_url ?? row.data_url });
  } catch (err) {
    console.error("[images] GET error:", err);
    return NextResponse.json({ ok: false, data: null });
  }
}

/** POST /api/images  body: { key, dataUrl } — compatibilité ancien système */
export async function POST(req: Request) {
  try {
    const { key, dataUrl } = await req.json();
    if (!key || !dataUrl)
      return NextResponse.json({ ok: false, error: "key ou dataUrl manquant" }, { status: 400 });

    await ensureTable();

    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType  = mimeMatch?.[1] ?? "image/webp";
    const ext       = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
    const byteSize  = Math.round((dataUrl.length * 3) / 4);

    // Tenter d'uploader directement sur B2
    let b2Url: string | null = null;
    try {
      const base64 = dataUrl.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      const b2key  = b2Key(key.split(":")[0], key.split(":")[1] ?? key, ext);
      b2Url = await uploadToB2(b2key, buffer, mimeType);
    } catch (b2err) {
      console.warn("[images] B2 upload failed, fallback MySQL:", b2err);
    }

    await execute(
      `INSERT INTO images (img_key, data_url, mime_type, byte_size, b2_url)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         data_url=VALUES(data_url), mime_type=VALUES(mime_type),
         byte_size=VALUES(byte_size), b2_url=VALUES(b2_url)`,
      [key, b2Url ? "" : dataUrl, mimeType, byteSize, b2Url]
    );

    return NextResponse.json({ ok: true, url: b2Url });
  } catch (err) {
    console.error("[images] POST error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** DELETE /api/images?key=product:42 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ ok: false }, { status: 400 });

    await ensureTable();
    const row = await queryOne<any>("SELECT b2_url FROM images WHERE img_key = ?", [key]);

    // Supprimer de Cellar si présent
    // L'URL Cellar est : https://woodizparis.cellar-c2.services.clever-cloud.com/woodiz/product/42.webp
    // On extrait la clé en retirant le slash initial du pathname
    if (row?.b2_url) {
      try {
        const cellarKey = new URL(row.b2_url).pathname.replace(/^\//, "");
        if (cellarKey) await deleteFromB2(cellarKey).catch(() => {});
      } catch {
        // URL malformée — on ignore, la ligne MySQL est quand même supprimée
      }
    }

    await execute("DELETE FROM images WHERE img_key = ?", [key]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[images] DELETE error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
