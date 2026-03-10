// app/api/store/route.ts
// Vercel KV database sync – stores the entire Woodiz state as a single JSON blob
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KV_KEY = "woodiz-store-v1";

export async function GET() {
  try {
    const data = await kv.get(KV_KEY);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[woodiz/api/store] GET error:", err);
    return NextResponse.json({ ok: false, data: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await kv.set(KV_KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[woodiz/api/store] POST error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
