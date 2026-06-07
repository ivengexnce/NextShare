import { create } from 'zustand';

/**
 * useStore — global Zustand store.
 *
 * Scaling rule: keep only truly cross-feature state here.
 *               Feature-local state lives in the component itself (useState).
 */
const useStore = create((set) => ({
  // ── Online status ─────────────────────────────────────────────────────────
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),

  // ── Toast notifications ───────────────────────────────────────────────────
  toasts: [],
  addToast(message, type = 'info', duration = 4000) {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Active tool tab ───────────────────────────────────────────────────────
  activeTab: 'url',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useStore;
