import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Cross-platform key/value persistence.
 *
 * On a native (iOS) build we persist through @capacitor/preferences (backed by
 * UserDefaults) so values survive outside the WebView cache. In the browser we
 * fall back to localStorage. The API is async so both backends share one shape.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly native = Capacitor.isNativePlatform();

  async get(key: string): Promise<string | null> {
    if (this.native) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (this.native) {
      await Preferences.set({ key, value });
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage full / disabled — ignore */
    }
  }

  async remove(key: string): Promise<void> {
    if (this.native) {
      await Preferences.remove({ key });
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
