export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';

function installStorage(): InstallStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function isInstallDismissed(storage = installStorage()): boolean {
  try {
    return storage?.getItem(INSTALL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(storage = installStorage()): void {
  try {
    storage?.setItem(INSTALL_DISMISSED_KEY, 'true');
  } catch {
    // Installation remains usable when storage is blocked or unavailable.
  }
}

export function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  const candidate = event as Partial<InstallPromptEvent>;
  return typeof candidate.prompt === 'function' && typeof candidate.userChoice?.then === 'function';
}
