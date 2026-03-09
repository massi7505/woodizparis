// components/client/ClosingAlert.tsx
"use client";
import { useState, useEffect } from "react";
import { useWoodizStore } from "@/lib/store";

function parseOpenHours(openHoursStr: string): { closeHour: number; closeMin: number } | null {
  // Parses patterns like "11h30–22h30" or "22h30" from the openHours string
  // Takes the last time range found (closing time)
  const matches = [...openHoursStr.matchAll(/(\d{1,2})h(\d{0,2})/g)];
  if (matches.length < 2) return null;
  const last = matches[matches.length - 1];
  return { closeHour: parseInt(last[1]), closeMin: parseInt(last[2] || "0") };
}

export default function ClosingAlert() {
  const { settings } = useWoodizStore();
  const [minsLeft, setMinsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const ca = settings.closingAlert;
      if (!ca?.enabled) { setMinsLeft(null); return; }
      const parsed = parseOpenHours(settings.openHours || "");
      if (!parsed) { setMinsLeft(null); return; }
      const now = new Date();
      const closeDate = new Date();
      closeDate.setHours(parsed.closeHour, parsed.closeMin, 0, 0);
      const diffMs = closeDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins > 0 && diffMins <= (ca.minutesBefore || 60)) {
        setMinsLeft(diffMins);
      } else {
        setMinsLeft(null);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [settings.closingAlert, settings.openHours]);

  if (!mounted || minsLeft === null || dismissed) return null;
  const ca = settings.closingAlert!;
  const text = (ca.text || "⚡ Vite ! Vite ! – nous fermons bientôt ! Commandez dans les {mins} min").replace("{mins}", String(minsLeft));

  return (
    <div
      className="w-full text-sm font-bold py-2.5 px-4 flex items-center justify-center relative animate-pulse-once"
      style={{ background: ca.bgColor || "#EF4444", color: ca.textColor || "#FFFFFF" }}
    >
      <span className="flex-1 text-center">{text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.15)" }}
        aria-label="Fermer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}
