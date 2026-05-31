import { Component, EventEmitter, Input, Output } from '@angular/core';
import { hexA, shade } from '../theme';

/** Chunky segmented control for 2-3 short options (used on the Settings screen). */
@Component({
  selector: 'ow-segmented',
  standalone: false,
  template: `
    <div class="ow-seg">
      <button *ngFor="let o of options" type="button"
              [ngStyle]="segStyle(o)" (click)="pick(o)">{{ o }}</button>
    </div>
  `,
  styles: [`
    .ow-seg {
      display: flex; gap: 6px; padding: 5px; border-radius: 16px;
      background: rgba(0,0,0,.22);
      box-shadow: inset 0 2px 4px rgba(0,0,0,.25);
    }
    .ow-seg button {
      flex: 1; min-width: 0; border: none; cursor: pointer;
      padding: 9px 6px; border-radius: 12px;
      font-family: var(--ow-font); font-weight: 600; font-size: 14px;
      text-transform: capitalize; transition: background .15s, color .15s, box-shadow .15s;
    }
  `],
})
export class SegmentedComponent {
  @Input() options: string[] = [];
  @Input() value = '';
  @Input() color = '#8a6cff';
  @Output() valueChange = new EventEmitter<string>();

  pick(o: string): void {
    if (o !== this.value) {
      this.value = o;
      this.valueChange.emit(o);
    }
  }

  segStyle(o: string): Record<string, string> {
    const on = o === this.value;
    return on
      ? {
          background: this.color,
          color: shade(this.color, -0.6),
          'box-shadow': `0 3px 0 ${shade(this.color, -0.42)}`,
        }
      : {
          background: hexA('#ffffff', 0.05),
          color: hexA('#ffffff', 0.7),
          'box-shadow': 'none',
        };
  }
}
