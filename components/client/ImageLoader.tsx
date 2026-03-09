// components/client/ImageLoader.tsx
// Resolves __idb: image references from IndexedDB after store hydration.
// Uses useWoodizStore.setState() directly to avoid triggering toast notifications.
"use client";
import { useEffect } from "react";
import { useWoodizStore } from "@/lib/store";
import { getImage } from "@/lib/imageDb";

export default function ImageLoader() {
  useEffect(() => {
    async function resolveImages() {
      const state = useWoodizStore.getState();
      const { products, settings, promos } = state;

      // ── 1. Product images ──────────────────────────────────────────────
      const resolvedProducts = await Promise.all(
        products.map(async (product) => {
          if (!product.img?.startsWith("__idb:")) return product;
          const key = product.img.slice("__idb:".length);
          const dataUrl = await getImage(key).catch(() => null);
          return dataUrl ? { ...product, img: dataUrl } : product;
        })
      );

      const productsChanged = resolvedProducts.some((p, i) => p !== products[i]);
      if (productsChanged) {
        // Direct setState — no toast, no side-effects
        useWoodizStore.setState({ products: resolvedProducts });
      }

      // ── 2. Slider slides ───────────────────────────────────────────────
      let slidesChanged = false;
      const resolvedSlides = await Promise.all(
        (settings.sliderSlides ?? []).map(async (s, i) => {
          if (s.type !== "image" || !s.value?.startsWith("__idb:")) return s;
          const key = s.value.slice("__idb:".length);
          const dataUrl = await getImage(key).catch(() => null);
          if (dataUrl) { slidesChanged = true; return { ...s, value: dataUrl }; }
          return s;
        })
      );

      // ── 3. Favicon ────────────────────────────────────────────────────
      let resolvedFaviconUrl = settings.faviconUrl;
      let faviconChanged = false;
      if (settings.faviconUrl?.startsWith("__idb:")) {
        const key = settings.faviconUrl.slice("__idb:".length);
        const dataUrl = await getImage(key).catch(() => null);
        if (dataUrl) { resolvedFaviconUrl = dataUrl; faviconChanged = true; }
      }

      if (slidesChanged || faviconChanged) {
        useWoodizStore.setState((s) => ({
          settings: {
            ...s.settings,
            ...(slidesChanged ? { sliderSlides: resolvedSlides } : {}),
            ...(faviconChanged ? { faviconUrl: resolvedFaviconUrl } : {}),
          },
        }));
      }

      // ── 4. Promo images ────────────────────────────────────────────────
      const resolvedPromos = await Promise.all(
        promos.map(async (promo) => {
          if (!promo.image?.startsWith("__idb:")) return promo;
          const key = promo.image.slice("__idb:".length);
          const dataUrl = await getImage(key).catch(() => null);
          return dataUrl ? { ...promo, image: dataUrl } : promo;
        })
      );

      const promosChanged = resolvedPromos.some((p, i) => p !== promos[i]);
      if (promosChanged) {
        useWoodizStore.setState({ promos: resolvedPromos });
      }
    }

    resolveImages();
  }, []); // Only run once after mount

  return null;
}
