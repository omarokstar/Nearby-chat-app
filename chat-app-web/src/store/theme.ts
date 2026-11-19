import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

function applyClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

export const useThemeStore = create<ThemeState>((set) => {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? stored === 'dark' : prefersDark;
  applyClass(isDark);

  return {
    isDark,
    toggle: () =>
      set((s) => {
        const next = !s.isDark;
        applyClass(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        return { isDark: next };
      }),
  };
});
