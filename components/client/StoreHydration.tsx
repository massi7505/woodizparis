// components/client/StoreHydration.tsx
"use client";
import { useEffect } from "react";
import { useWoodizStore } from "@/lib/store";
import { saveImage, imgKey } from "@/lib/imageDb";

/** Maps browser language codes → our supported locales */
function detectLocale(supported: string[]): string | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase(); // "fr-FR" → "fr"
    if (supported.includes(code)) return code;
  }
  return null;
}

export default function StoreHydration() {
  useEffect(() => {
    // Before rehydrating, migrate any existing base64 images from localStorage to IndexedDB
    try {
      const raw = localStorage.getItem("woodiz-store");
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = parsed?.state;
        let changed = false;

        // Migrate product images
        if (state?.products) {
          state.products = state.products.map((p: any) => {
            if (p.img?.startsWith("data:")) {
              const key = imgKey("product", p.id);
              saveImage(key, p.img);
              changed = true;
              return { ...p, img: `__idb:product:${p.id}` };
            }
            return p;
          });
        }

        // Migrate slider images
        if (state?.settings?.sliderSlides) {
          state.settings.sliderSlides = state.settings.sliderSlides.map((s: any, i: number) => {
            if (s.type === "image" && s.value?.startsWith("data:")) {
              const key = `slider:${i}`;
              saveImage(key, s.value);
              changed = true;
              return { ...s, value: `__idb:slider:${i}` };
            }
            return s;
          });
        }

        if (changed) {
          localStorage.setItem("woodiz-store", JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Store migration failed, clearing localStorage:", e);
      try { localStorage.removeItem("woodiz-store"); } catch {}
    }

    // Rehydrate the store from localStorage
    useWoodizStore.persist.rehydrate();

    // Auto-detect browser language AFTER rehydration
    // Only auto-switch if the user has never manually chosen a language
    // We check if "woodiz-locale-manual" is set in localStorage
    const manualChoice = localStorage.getItem("woodiz-locale-manual");
    if (!manualChoice) {
      const store = useWoodizStore.getState();
      const supported = store.translations.map((t) => t.locale);
      const detected = detectLocale(supported);
      if (detected && detected !== store.activeLocale) {
        store.setLocale(detected);
      }
    }
  }, []);

  return null;
}
