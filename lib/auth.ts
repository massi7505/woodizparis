// lib/auth.ts — Session auth (not persisted, clears on browser close)
import { create } from "zustand";

interface AuthStore {
  isAuthenticated: boolean;
  login: (username: string, password: string, correctUsername: string, correctPassword: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  login: (username, password, correctUsername, correctPassword) => {
    if (username === correctUsername && password === correctPassword) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
}));
