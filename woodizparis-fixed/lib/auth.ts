// lib/auth.ts — Session côté client (non persistée — se réinitialise à la fermeture du navigateur)
// L'authentification réelle est vérifiée par /api/auth → MySQL.
// Ce store garde uniquement l'état de session en mémoire.
import { create } from "zustand";

interface AuthStore {
  isAuthenticated: boolean;
  markAuthenticated: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  markAuthenticated: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}));
