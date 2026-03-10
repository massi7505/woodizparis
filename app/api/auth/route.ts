// app/api/auth/route.ts
// Vérifie les identifiants admin directement en base MySQL.
// Évite le problème de timing où le store Zustand n'est pas encore hydraté.

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { queryOne } from "@/lib/mysql";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Identifiants manquants" }, { status: 400 });
    }

    const row = await queryOne<{ username: string; password_hash: string }>(
      "SELECT username, password_hash FROM admin_credentials WHERE id = 1"
    );

    // Fallback sur les valeurs par défaut si la table est vide
    const validUsername = row?.username ?? "admin";
    const validPassword = row?.password_hash ?? "woodiz2024";

    if (username === validUsername && password === validPassword) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  } catch (err) {
    console.error("[auth] POST error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
