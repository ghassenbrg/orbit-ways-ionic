import { Component, Input } from '@angular/core';
import { hexA, shade } from '../theme';

/** A row of chunky stars; the first `n` are filled in the player's colour. */
@Component({
  selector: 'ow-score-stars',
  standalone: false,
  template: `
    <div class="ow-stars">
      <svg *ngFor="let i of slots" [attr.width]="sz" [attr.height]="sz" viewBox="0 0 24 24">
        <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.6 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"
          [attr.fill]="i < n ? color : 'none'"
          [attr.stroke]="i < n ? strokeFilled : strokeEmpty"
          stroke-width="1.6" stroke-linejoin="round"
          [style.filter]="i < n ? glow : 'none'" />
      </svg>
    </div>
  `,
  styles: [`
    .ow-stars { display: flex; gap: 3px; }
    .ow-stars svg { display: block; }
  `],
})
export class ScoreStarsComponent {
  @Input() n = 0;
  @Input() max = 3;
  @Input() color = '#8a6cff';

  get slots(): number[] {
    return Array.from({ length: this.max }, (_, i) => i);
  }
  get sz(): number {
    return this.max > 5 ? 13 : 16;
  }
  get strokeFilled(): string {
    return shade(this.color, -0.2);
  }
  get strokeEmpty(): string {
    return hexA('#fff', 0.3);
  }
  get glow(): string {
    return `drop-shadow(0 0 4px ${hexA(this.color, 0.8)})`;
  }
}
