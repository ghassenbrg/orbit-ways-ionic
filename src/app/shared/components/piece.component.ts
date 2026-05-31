import { Component, Input } from '@angular/core';
import { hexA, Palette, shade, Side, TOKEN_SETS, TokenKey } from '../theme';

/** A token: character art sitting on a chunky colour pad (or a plain orb). */
@Component({
  selector: 'ow-piece',
  standalone: false,
  template: `
    <div class="ow-piece" [style.width.px]="size" [style.height.px]="size"
         [style.animation]="idle ? 'ow-wobble 3s ease-in-out infinite' : 'none'">
      <div class="ow-piece-pad" [ngStyle]="padStyle"></div>
      <img *ngIf="img" [src]="img" alt="" draggable="false" [ngStyle]="imgStyle" />
    </div>
  `,
  styles: [`
    .ow-piece { position: relative; }
    .ow-piece-pad { position: absolute; inset: 0; border-radius: 50%; }
    .ow-piece img {
      position: absolute; inset: 15%; width: 70%; height: 70%;
      object-fit: contain; filter: drop-shadow(0 2px 1px rgba(0,0,0,.3));
    }
  `],
})
export class PieceComponent {
  @Input() side: Side = 'B';
  @Input() tokens: TokenKey = 'astro';
  @Input() colors!: Palette;
  @Input() size = 48;
  @Input() idle = false;

  get img(): string | null {
    const set = TOKEN_SETS[this.tokens];
    return set ? set[this.side] : null;
  }

  get padStyle(): Record<string, string> {
    const color = this.colors[this.side];
    const lift = Math.max(2, this.size * 0.07);
    return {
      background: `radial-gradient(circle at 50% 30%, ${hexA('#ffffff', 0.55)} 0%, ${color} 48%, ${shade(color, -0.32)} 100%)`,
      'box-shadow': `0 ${lift}px 0 ${shade(color, -0.5)}, inset 0 2px 3px ${hexA('#ffffff', 0.55)}`,
      border: `2px solid ${hexA('#ffffff', 0.75)}`,
    };
  }

  get imgStyle(): Record<string, string> {
    return {};
  }
}
