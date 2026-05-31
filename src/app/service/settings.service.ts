import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  FlowMode,
  Motion,
  MOTION_MS,
  Palette,
  PaletteName,
  PALETTES,
  TokenKey,
} from '../shared/theme';
import { StorageService } from './storage.service';

/** Visual / motion tweaks — the "live Tweaks" from the design, persisted. */
export interface Tweaks {
  palette: PaletteName;
  tokens: TokenKey;
  flowMode: FlowMode;
  motion: Motion;
  starfield: boolean;
}

/** Everything we persist: the visual tweaks plus app-level prefs. */
export interface AppSettings extends Tweaks {
  /** Absolute backend base URL for online play (needed in the packaged app). */
  serverUrl: string;
  /** Remembered display name to pre-fill the lobby. */
  lastName: string;
}

const STORAGE_KEY = 'ow.settings';

const DEFAULTS: AppSettings = {
  palette: 'Aurora',
  tokens: 'astro',
  flowMode: 'bold',
  motion: 'snappy',
  starfield: true,
  serverUrl: '',
  lastName: '',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private subject = new BehaviorSubject<AppSettings>({ ...DEFAULTS });

  /** Stream of the current settings — emits on every change. */
  readonly settings$: Observable<AppSettings> = this.subject.asObservable();

  constructor(private storage: StorageService) {}

  get value(): AppSettings {
    return this.subject.value;
  }

  /** Load persisted settings into memory. Called once via APP_INITIALIZER. */
  async init(): Promise<void> {
    const raw = await this.storage.get(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      // Merge over defaults so a newly-added key always has a value.
      this.subject.next({ ...DEFAULTS, ...parsed });
    } catch {
      /* corrupt blob — keep defaults */
    }
  }

  /** Patch any subset of settings, then persist. */
  async set(patch: Partial<AppSettings>): Promise<void> {
    const next = { ...this.subject.value, ...patch };
    this.subject.next(next);
    await this.storage.set(STORAGE_KEY, JSON.stringify(next));
  }

  setTweak<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    return this.set({ [key]: value } as Partial<AppSettings>);
  }

  async reset(): Promise<void> {
    this.subject.next({ ...DEFAULTS });
    await this.storage.set(STORAGE_KEY, JSON.stringify(DEFAULTS));
  }

  // ── Derived values ────────────────────────────────────────────────────────
  get colors(): Palette {
    return PALETTES[this.value.palette] || PALETTES.Aurora;
  }

  get duration(): number {
    return MOTION_MS[this.value.motion] || MOTION_MS.bouncy;
  }

  get tokens(): TokenKey {
    return this.value.tokens;
  }

  /** Base URL for HTTP + WebSocket: configured server URL, else the dev proxy. */
  apiBase(): string {
    const url = (this.value.serverUrl || '').trim().replace(/\/+$/, '');
    return url || environment.basePath;
  }
}
