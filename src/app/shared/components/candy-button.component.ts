import { Component, EventEmitter, Input, Output } from '@angular/core';
import { hexA, shade } from '../theme';

/** Fat 3D candy button with a pressable bottom edge. Projects its label. */
@Component({
  selector: 'ow-candy-button',
  standalone: false,
  template: `
    <button type="button" [ngStyle]="style" [class.ow-pressed]="pressed"
            (pointerdown)="pressed = true" (pointerup)="release()"
            (pointerleave)="pressed = false" (click)="press.emit()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      border: none; cursor: pointer; font-family: var(--ow-font);
      transition: transform .07s; line-height: 1.1;
    }
    button.ow-pressed { transform: translateY(3px); }
  `],
})
export class CandyButtonComponent {
  @Input() color = '#8a6cff';
  @Input() big = false;
  /** Stretch to fill the container width. */
  @Input() full = false;
  @Output() press = new EventEmitter<void>();

  pressed = false;

  release(): void {
    this.pressed = false;
  }

  get style(): Record<string, string> {
    return {
      padding: this.big ? '15px 30px' : '12px 24px',
      'border-radius': '18px',
      background: this.color,
      color: shade(this.color, -0.62),
      'font-weight': '600',
      'font-size': this.big ? '18px' : '16px',
      'letter-spacing': '0.3px',
      width: this.full ? '100%' : 'auto',
      'box-shadow': `0 5px 0 ${shade(this.color, -0.42)}, 0 8px 14px ${hexA(this.color, 0.4)}`,
      'text-shadow': `0 1px 0 ${hexA('#fff', 0.4)}`,
    };
  }
}
