import { create } from 'zustand';

interface FileStore {
  droppedFile: File | null;
  setDroppedFile: (file: File | null) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  droppedFile: null,
  setDroppedFile: (file) => set({ droppedFile: file }),
}));
