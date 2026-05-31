import { Component, EventEmitter, Input, Output } from '@angular/core';

/** iOS-style on/off switch. */
@Component({
  selector: 'ow-toggle',
  standalone: false,
  template: `
    <button type="button" class="ow-toggle" [attr.data-on]="value ? '1' : '0'"
            role="switch" [attr.aria-checked]="value" (click)="toggle()">
      <i></i>
    </button>
  `,
  styles: [`
    .ow-toggle {
      position: relative; width: 52px; height: 30px; border: none;
      border-radius: 999px; background: rgba(255,255,255,.16);
      transition: background .15s; cursor: pointer; padding: 0;
    }
    .ow-toggle[data-on="1"] { background: #34c759; }
    .ow-toggle i {
      position: absolute; top: 3px; left: 3px; width: 24px; height: 24px;
      border-radius: 50%; background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: transform .15s;
    }
    .ow-toggle[data-on="1"] i { transform: translateX(22px); }
  `],
})
export class ToggleComponent {
  @Input() value = false;
  @Output() valueChange = new EventEmitter<boolean>();

  toggle(): void {
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }
}
