import { Injectable } from '@angular/core';
import { Side } from '../shared/theme';
import { StorageService } from './storage.service';

export type GameMode = 'local' | 'online';

/** Everything the game page needs to start a match, handed over by the lobby. */
export interface StartOptions {
  mode: GameMode;
  roomCode: string;
  maxScore: number;
  /** Local: host's chosen side. Online: my assigned colour. */
  mySide: Side;
  /** Display name / identity (also the userId used by the online backend). */
  myName: string;
}

const SESSION_KEY = 'ow.session';

/**
 * Handover of the chosen match config from lobby → game. The config is also
 * mirrored to storage so a page reload (web) can restore / rejoin the match.
 */
@Injectable({ providedIn: 'root' })
export class GameConfigService {
  options: StartOptions | null = null;

  constructor(private storage: StorageService) {}

  /** Persist the chosen config and remember it in memory. */
  async start(opts: StartOptions): Promise<void> {
    this.options = opts;
    await this.storage.set(SESSION_KEY, JSON.stringify(opts));
  }

  /** Return the live config, restoring from storage after a reload if needed. */
  async restore(): Promise<StartOptions | null> {
    if (this.options) return this.options;
    const raw = await this.storage.get(SESSION_KEY);
    if (raw) {
      try {
        this.options = JSON.parse(raw) as StartOptions;
        return this.options;
      } catch {
        /* corrupt — fall through */
      }
    }
    return null;
  }

  async clear(): Promise<void> {
    this.options = null;
    await this.storage.remove(SESSION_KEY);
  }
}
