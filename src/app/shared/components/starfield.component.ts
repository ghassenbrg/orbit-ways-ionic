import { Component, Input, OnInit } from '@angular/core';

interface Star {
  x: number; y: number; r: number; d: number; delay: number; col: string; star: boolean;
}

/** Chunky colourful star/sparkle field — deterministic from a seed. */
@Component({
  selector: 'ow-starfield',
  standalone: false,
  template: `
    <div class="ow-starfield" *ngIf="show">
      <div *ngFor="let st of stars" class="ow-star" [ngStyle]="styleFor(st)"></div>
    </div>
  `,
  styles: [`
    .ow-starfield {
      position: absolute; inset: 0; overflow: hidden;
      pointer-events: none; z-index: 0;
    }
    .ow-star { position: absolute; opacity: 0.85; }
  `],
})
export class StarfieldComponent implements OnInit {
  @Input() show = true;
  @Input() count = 34;
  @Input() seed = 11;

  stars: Star[] = [];

  ngOnInit(): void {
    let s = this.seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const cols = ['#fff', '#ffe27a', '#9ad8ff', '#ff9ad8', '#c4a6ff'];
    this.stars = Array.from({ length: this.count }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: 1.4 + rnd() * 3.2,
      d: 2.5 + rnd() * 4,
      delay: rnd() * 5,
      col: cols[Math.floor(rnd() * cols.length)],
      star: rnd() > 0.7,
    }));
  }

  styleFor(st: Star): Record<string, string> {
    return {
      left: `${st.x}%`,
      top: `${st.y}%`,
      width: `${st.r * 2}px`,
      height: `${st.r * 2}px`,
      'border-radius': st.star ? '2px' : '50%',
      transform: st.star ? 'rotate(45deg)' : 'none',
      background: st.col,
      'box-shadow': `0 0 ${st.r * 3}px ${st.col}`,
      animation: `ow-twinkle ${st.d}s ease-in-out ${st.delay}s infinite`,
    };
  }
}
