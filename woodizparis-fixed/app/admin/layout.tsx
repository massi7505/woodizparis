// app/admin/layout.tsx
import type { Metadata } from "next";
import AuthGuard from "@/components/admin/AuthGuard";

export const metadata: Metadata = {
  title: "Admin – WOODIZ",
  description: "Interface d'administration WOODIZ",
  robots: { index: false, follow: false }, // Ne pas indexer l'admin
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
