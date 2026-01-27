import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    set => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: user => set({ user: user ? { ...user, isAdmin: Boolean(user.isAdmin) } : null, isAuthenticated: !!user }),
      setToken: token => set({ token }),
      login: (user, token) => set({ user: user ? { ...user, isAdmin: Boolean(user.isAdmin) } : null, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage'
    }
  )
);
