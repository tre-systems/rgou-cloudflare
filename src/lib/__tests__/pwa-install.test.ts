import { describe, expect, it, vi } from 'vitest';
import {
  INSTALL_DISMISSED_KEY,
  dismissInstallPrompt,
  isInstallDismissed,
  isInstallPromptEvent,
} from '../pwa-install';

describe('PWA install policy', () => {
  it('treats missing or blocked storage as not dismissed', () => {
    expect(isInstallDismissed(null)).toBe(false);
    expect(
      isInstallDismissed({
        getItem: () => {
          throw new TypeError('storage unavailable');
        },
        setItem: vi.fn(),
      })
    ).toBe(false);
  });

  it('persists dismissal when storage is available', () => {
    const setItem = vi.fn();

    dismissInstallPrompt({ getItem: vi.fn(), setItem });

    expect(setItem).toHaveBeenCalledWith(INSTALL_DISMISSED_KEY, 'true');
  });

  it('accepts only complete beforeinstallprompt events', () => {
    const valid = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    expect(isInstallPromptEvent(valid)).toBe(true);
    expect(isInstallPromptEvent(new Event('beforeinstallprompt'))).toBe(false);
  });
});
