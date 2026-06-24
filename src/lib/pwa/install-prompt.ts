export const PWA_INSTALL_STORAGE_KEY = "barane-pwa-install-prompt-v1";

export type PwaInstallStorageValue = "dismissed" | "installed";

export function readPwaInstallChoice(): PwaInstallStorageValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(PWA_INSTALL_STORAGE_KEY);
    return value === "dismissed" || value === "installed" ? value : null;
  } catch {
    return null;
  }
}

export function writePwaInstallChoice(value: PwaInstallStorageValue): void {
  try {
    window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, value);
  } catch {
    // Ignore private browsing / quota errors.
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function canShowIosInstallInstructions(): boolean {
  return isIosDevice() && !isStandaloneDisplay();
}
