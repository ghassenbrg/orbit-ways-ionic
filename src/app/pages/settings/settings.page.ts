import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppSettings, SettingsService } from 'src/app/service/settings.service';
import {
  fieldBackground,
  FlowMode,
  hexA,
  Motion,
  Palette,
  PALETTE_NAMES,
  PaletteName,
  PALETTES,
  Side,
  TOKEN_KEYS,
  TOKEN_SETS,
  TokenKey,
} from 'src/app/shared/theme';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit, OnDestroy {
  s!: AppSettings;
  colors!: Palette;
  fieldBg = '';

  readonly paletteNames = PALETTE_NAMES;
  readonly tokenKeys = TOKEN_KEYS;
  readonly flowOptions: FlowMode[] = ['bold', 'subtle', 'hidden'];
  readonly motionOptions: Motion[] = ['snappy', 'bouncy', 'calm'];
  readonly sides: Side[] = ['B', 'W'];

  private sub?: Subscription;

  constructor(private settings: SettingsService, private nav: NavController) {}

  ngOnInit(): void {
    this.sub = this.settings.settings$.subscribe((v) => {
      this.s = v;
      this.colors = this.settings.colors;
      this.fieldBg = fieldBackground(this.colors);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  back(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.nav.navigateBack('/room');
  }

  // ── Setters ──
  setPalette(p: PaletteName): void {
    this.settings.setTweak('palette', p);
  }
  setTokens(t: TokenKey): void {
    this.settings.setTweak('tokens', t);
  }
  setFlow(f: string): void {
    this.settings.setTweak('flowMode', f as FlowMode);
  }
  setMotion(m: string): void {
    this.settings.setTweak('motion', m as Motion);
  }
  setStarfield(v: boolean): void {
    this.settings.setTweak('starfield', v);
  }
  setServerUrl(url: string): void {
    this.settings.set({ serverUrl: url });
  }
  resetAll(): void {
    this.settings.reset();
  }

  // ── View helpers ──
  paletteColors(name: PaletteName): Palette {
    return PALETTES[name];
  }

  tokenLabel(key: TokenKey): string {
    return TOKEN_SETS[key]?.label || 'Plain orbs';
  }

  paletteChipStyle(name: PaletteName): Record<string, string> {
    const on = this.s.palette === name;
    return {
      border: `2.5px solid ${on ? '#fff' : hexA('#fff', 0.14)}`,
      'box-shadow': on ? `0 0 0 2px ${hexA('#fff', 0.5)}` : 'none',
    };
  }

  tokenCardStyle(key: TokenKey): Record<string, string> {
    const on = this.s.tokens === key;
    return {
      background: hexA('#ffffff', on ? 0.12 : 0.04),
      border: `2.5px solid ${on ? this.colors.B : hexA('#fff', 0.1)}`,
      'box-shadow': on ? `0 3px 0 ${hexA('#000', 0.2)}` : 'none',
    };
  }
}
