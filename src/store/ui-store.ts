import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isSearchOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
}));
