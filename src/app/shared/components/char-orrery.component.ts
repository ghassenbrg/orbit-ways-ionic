import { Component, Input } from '@angular/core';
import { hexA, Palette, TokenKey } from '../theme';

/** Animated mini-orrery wordmark for the lobby: a sun with two orbiting tokens. */
@Component({
  selector: 'ow-char-orrery',
  standalone: false,
  template: `
    <div class="ow-orrery" [style.width.px]="size" [style.height.px]="size">
      <div class="ow-sun"></div>

      <!-- inner ring -->
      <div class="ow-ring" [ngStyle]="ringStyle(size * 0.55, 7, false)">
        <div class="ow-ring-token" [ngStyle]="tokenStyle(7, true)">
          <ow-piece side="B" [tokens]="tokens" [colors]="colors" [size]="44"></ow-piece>
        </div>
      </div>

      <!-- outer ring -->
      <div class="ow-ring" [ngStyle]="ringStyle(size, 12, true)">
        <div class="ow-ring-token" [ngStyle]="tokenStyle(12, false)">
          <ow-piece side="W" [tokens]="tokens" [colors]="colors" [size]="44"></ow-piece>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ow-orrery { position: relative; }
    .ow-sun {
      position: absolute; left: 50%; top: 50%; width: 30px; height: 30px;
      margin-left: -15px; margin-top: -15px; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #fff, #ffd23f 55%, #f5a623);
      box-shadow: 0 0 22px rgba(255,210,63,0.7), 0 3px 0 #c98a17;
    }
    .ow-ring { position: absolute; left: 50%; top: 50%; }
    .ow-ring-token { position: absolute; top: -22px; left: 50%; margin-left: -22px; width: 44px; height: 44px; }
  `],
})
export class CharOrreryComponent {
  @Input() colors!: Palette;
  @Input() tokens: TokenKey = 'astro';
  @Input() size = 150;

  ringStyle(d: number, dur: number, rev: boolean): Record<string, string> {
    return {
      width: `${d}px`,
      height: `${d}px`,
      'margin-left': `${-d / 2}px`,
      'margin-top': `${-d / 2}px`,
      'border-radius': '50%',
      border: `2px dashed ${hexA('#fff', 0.16)}`,
      animation: `ow-spin ${dur}s linear infinite ${rev ? 'reverse' : ''}`,
    };
  }

  // The token counter-spins so the character stays upright as the ring rotates.
  tokenStyle(dur: number, rev: boolean): Record<string, string> {
    return {
      animation: `ow-spin ${dur}s linear infinite ${rev ? '' : 'reverse'}`,
    };
  }
}
