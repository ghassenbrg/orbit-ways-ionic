import { Component, EventEmitter, Input, Output } from '@angular/core';
import { shade } from '../theme';

/** −/+ stepper with candy buttons, clamped to [min, max]. */
@Component({
  selector: 'ow-stepper',
  standalone: false,
  template: `
    <div class="ow-stepper">
      <button type="button" [ngStyle]="btnStyle" (click)="bump(-1)">−</button>
      <div class="ow-stepper-val">{{ value }}</div>
      <button type="button" [ngStyle]="btnStyle" (click)="bump(1)">+</button>
    </div>
  `,
  styles: [`
    .ow-stepper { display: flex; align-items: center; gap: 16px; }
    .ow-stepper button {
      width: 46px; height: 46px; border-radius: 14px; cursor: pointer;
      border: none; font-size: 24px; font-family: var(--ow-font); font-weight: 600;
    }
    .ow-stepper-val {
      min-width: 34px; text-align: center; font-family: var(--ow-font);
      font-size: 28px; font-weight: 600; color: #fff;
    }
  `],
})
export class StepperComponent {
  @Input() value = 3;
  @Input() color = '#8a6cff';
  @Input() min = 1;
  @Input() max = 9;
  @Output() valueChange = new EventEmitter<number>();

  bump(delta: number): void {
    const next = Math.max(this.min, Math.min(this.max, this.value + delta));
    if (next !== this.value) {
      this.value = next;
      this.valueChange.emit(next);
    }
  }

  get btnStyle(): Record<string, string> {
    return {
      background: this.color,
      color: shade(this.color, -0.6),
      'box-shadow': `0 4px 0 ${shade(this.color, -0.42)}`,
    };
  }
}
