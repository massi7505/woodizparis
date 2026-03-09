// app/admin/page.tsx
"use client";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardTab from "@/components/admin/tabs/Dashboard";
import ProductsTab from "@/components/admin/tabs/ProductsTab";
import CategoriesTab from "@/components/admin/tabs/CategoriesTab";
import PromosTab from "@/components/admin/tabs/PromosTab";
import SliderTab from "@/components/admin/tabs/SliderTab";
import SEOTab from "@/components/admin/tabs/SEOTab";
import DesignTab from "@/components/admin/tabs/DesignTab";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import NotificationTab from "@/components/admin/tabs/NotificationTab";
import AppBannerTab from "@/components/admin/tabs/AppBannerTab";
import LanguagesTab from "@/components/admin/tabs/LanguagesTab";
import FAQTab from "@/components/admin/tabs/FAQTab";
import SecurityTab from "@/components/admin/tabs/SecurityTab";
import ReviewsTab from "@/components/admin/tabs/ReviewsTab";
import FeaturesTab from "@/components/admin/tabs/FeaturesTab";
import LegalTab from "@/components/admin/tabs/LegalTab";
import FooterTab from "@/components/admin/tabs/FooterTab";
import GooglePopupTab from "@/components/admin/tabs/GooglePopupTab";
import Toast from "@/components/ui/Toast";
import { useWoodizStore } from "@/lib/store";

const TABS: Record<string, React.ComponentType> = {
  dashboard: DashboardTab,
  products: ProductsTab,
  categories: CategoriesTab,
  promos: PromosTab,
  slider: SliderTab,
  notification: NotificationTab,
  appbanner: AppBannerTab,
  faq: FAQTab,
  reviews: ReviewsTab,
  googlePopup: GooglePopupTab,
  footer: FooterTab,
  legal: LegalTab,
  languages: LanguagesTab,
  seo: SEOTab,
  design: DesignTab,
  security: SecurityTab,
  settings: SettingsTab,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { settings, adminCredentials } = useWoodizStore();
  const ActiveComponent = TABS[activeTab] || DashboardTab;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Synchronisation activée</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">
              👤 {adminCredentials.username}
            </span>
            <a href="/" target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-full border hover:border-amber-400 hover:text-amber-500 transition-all"
              style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
              ↗ Voir le site
            </a>
          </div>
        </div>
        <div className="animate-fade-in">
          <ActiveComponent />
        </div>
      </div>
      <Toast />
    </div>
  );
}
