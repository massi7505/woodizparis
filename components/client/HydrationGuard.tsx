// components/client/HydrationGuard.tsx
"use client";
import { useEffect, useState } from "react";
import { useWoodizStore } from "@/lib/store";

/**
 * Blocks rendering until the Zustand store is rehydrated from localStorage.
 * This prevents the "flash of default values" on page load.
 *
 * Works in tandem with:
 *  - lib/store.ts        → skipHydration: true  (no auto-hydration on mount)
 *  - StoreHydration.tsx  → calls persist.rehydrate() after IDB migration
 */
export default function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If hydration already completed (e.g. fast navigation), skip the wait
    if (useWoodizStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }

    // Otherwise wait for StoreHydration.tsx to call rehydrate()
    const unsub = useWoodizStore.persist.onFinishHydration(() => {
      setReady(true);
    });

    // Safety fallback: if rehydrate() was never called, show content after 500ms
    const timeout = setTimeout(() => setReady(true), 500);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#ffffff" }}
      >
        <div
          className="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: "#F59E0B", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
