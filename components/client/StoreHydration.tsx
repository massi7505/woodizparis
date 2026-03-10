// components/client/StoreHydration.tsx
"use client";
import { useEffect, useRef } from "react";
import { useWoodizStore } from "@/lib/store";
import { saveImage, imgKey } from "@/lib/imageDb";

function detectLocale(supported: string[]): string | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase();
    if (supported.includes(code)) return code;
  }
  return null;
}

async function saveToKV(state: any) {
  try {
    const payload = {
      settings: {
        ...state.settings,
        sliderSlides: state.settings.sliderSlides?.map((s: any, i: number) => ({
          ...s,
          value: s.type === "image" && s.value?.startsWith("data:") ? `__idb:slider:${i}` : s.value,
        })),
        faviconUrl: state.settings.faviconUrl?.startsWith("data:") ? "__idb:favicon:0" : state.settings.faviconUrl,
      },
      categories: state.categories,
      products: state.products.map((p: any) => ({
        ...p,
        img: p.img?.startsWith("data:") ? `__idb:product:${p.id}` : p.img,
      })),
      promos: state.promos.map((p: any) => ({
        ...p,
        image: p.image?.startsWith("data:") ? `__idb:promo:${p.id}` : p.image,
      })),
      faqs: state.faqs,
      legalPages: state.legalPages,
      reviews: state.reviews,
      googleReviewPopup: state.googleReviewPopup,
      translations: state.translations,
      activeLocale: state.activeLocale,
      adminCredentials: state.adminCredentials,
    };
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("[StoreHydration] KV save failed:", e);
  }
}

async function loadFromKV(): Promise<any | null> {
  try {
    const res = await fetch("/api/store");
    const json = await res.json();
    return json?.ok && json?.data ? json.data : null;
  } catch (e) {
    console.warn("[StoreHydration] KV load failed:", e);
    return null;
  }
}

let kvSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export default function StoreHydration() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const raw = localStorage.getItem("woodiz-store");
        if (raw) {
          const parsed = JSON.parse(raw);
          const state = parsed?.state;
          let changed = false;
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
          if (state?.settings?.sliderSlides) {
            state.settings.sliderSlides = state.settings.sliderSlides.map((s: any, i: number) => {
              if (s.type === "image" && s.value?.startsWith("data:")) {
                saveImage(`slider:${i}`, s.value);
                changed = true;
                return { ...s, value: `__idb:slider:${i}` };
              }
              return s;
            });
          }
          if (changed) localStorage.setItem("woodiz-store", JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn("Store migration failed:", e);
        try { localStorage.removeItem("woodiz-store"); } catch {}
      }

      useWoodizStore.persist.rehydrate();

      const kvData = await loadFromKV();
      if (kvData) {
        if (kvData.settings) useWoodizStore.setState((s) => ({ settings: { ...s.settings, ...kvData.settings } }));
        if (kvData.categories) useWoodizStore.setState({ categories: kvData.categories });
        if (kvData.products) useWoodizStore.setState({ products: kvData.products });
        if (kvData.promos) useWoodizStore.setState({ promos: kvData.promos });
        if (kvData.faqs) useWoodizStore.setState({ faqs: kvData.faqs });
        if (kvData.legalPages) useWoodizStore.setState({ legalPages: kvData.legalPages });
        if (kvData.reviews) useWoodizStore.setState({ reviews: kvData.reviews });
        if (kvData.googleReviewPopup) useWoodizStore.setState({ googleReviewPopup: kvData.googleReviewPopup });
        if (kvData.translations) useWoodizStore.setState({ translations: kvData.translations });
        if (kvData.adminCredentials) useWoodizStore.setState({ adminCredentials: kvData.adminCredentials });
      }

      const manualChoice = localStorage.getItem("woodiz-locale-manual");
      if (!manualChoice) {
        const store = useWoodizStore.getState();
        const supported = store.translations.filter((t) => t.enabled !== false).map((t) => t.locale);
        const detected = detectLocale(supported);
        if (detected && detected !== store.activeLocale) store.setLocale(detected);
      }

      useWoodizStore.subscribe((state) => {
        if (kvSaveTimeout) clearTimeout(kvSaveTimeout);
        kvSaveTimeout = setTimeout(() => saveToKV(state), 1500);
      });
    }

    init();
  }, []);

  return null;
}
