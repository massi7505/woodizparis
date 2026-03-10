// app/api/auth/route.ts
// Vérifie les identifiants admin directement en base MySQL.
// Le mot de passe est stocké avec un hash bcrypt-like via Node.js crypto.
// Pour la rétrocompatibilité, on accepte aussi la comparaison directe si
// le hash n'est pas encore migré (commence par "__plain__").

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { queryOne } from "@/lib/mysql";

/** Hash SHA-256 simple — suffisant pour un admin mono-user.
 *  En production, préférer bcrypt. */
function hashPassword(plain: string): string {
  const salt = process.env.AUTH_SALT || "woodiz";
  return createHash("sha256").update(plain + salt).digest("hex");
}

/** Comparaison à temps constant pour éviter les timing attacks */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const username: string = body?.username ?? "";
    const password: string = body?.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Identifiants manquants" }, { status: 400 });
    }

    // Limite la longueur pour éviter les attaques par DoS sur le hash
    if (username.length > 100 || password.length > 200) {
      return NextResponse.json({ ok: false, error: "Identifiants invalides" }, { status: 400 });
    }

    const row = await queryOne<{ username: string; password_hash: string }>(
      "SELECT username, password_hash FROM admin_credentials WHERE id = 1"
    );

    const validUsername = row?.username ?? "admin";
    const storedHash   = row?.password_hash ?? hashPassword("woodiz2024");

    const isUsernameOk = safeCompare(username, validUsername);

    // Rétrocompatibilité : si le hash stocké est en clair (migration non effectuée)
    const isPasswordOk = storedHash.startsWith("__plain__")
      ? safeCompare(password, storedHash.slice("__plain__".length))
      : safeCompare(hashPassword(password), storedHash);

    if (isUsernameOk && isPasswordOk) {
      return NextResponse.json({ ok: true });
    }

    // Délai anti-brute force (500ms minimum)
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ ok: false, error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  } catch (err) {
    console.error("[auth] POST error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
