import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { hexA } from '../theme';

interface Part {
  dx: number; dy: number; s: number; rot: number; col: string; delay: number; dur: number; round: boolean;
}

/**
 * Chunky multi-colour confetti burst (squares + circles). Animated with the Web
 * Animations API so each particle flies to its own offset without relying on
 * per-element CSS custom properties.
 */
@Component({
  selector: 'ow-particle-burst',
  standalone: false,
  template: `
    <div class="ow-burst" #host>
      <div *ngFor="let p of parts" class="ow-part" [ngStyle]="styleFor(p)"></div>
    </div>
  `,
  styles: [`
    .ow-burst {
      position: absolute; inset: 0; pointer-events: none; z-index: 40;
      display: flex; align-items: center; justify-content: center;
    }
    .ow-part { position: absolute; }
  `],
})
export class ParticleBurstComponent implements OnInit, AfterViewInit {
  @Input() color = '#ffffff';
  @Input() big = false;
  @Input() n = 30;

  @ViewChild('host') host!: ElementRef<HTMLElement>;
  parts: Part[] = [];

  ngOnInit(): void {
    // Generate on init so the particles exist in the first render pass.
    const cols = [this.color, '#ffe27a', '#fff', '#ff9ad8', '#9ad8ff'];
    this.parts = Array.from({ length: this.n }, (_, i) => {
      const ang = (i / this.n) * Math.PI * 2 + Math.random() * 0.6;
      const dist = (this.big ? 165 : 110) * (0.5 + Math.random() * 0.7);
      return {
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - (this.big ? 30 : 18),
        s: (this.big ? 11 : 8) * (0.6 + Math.random() * 0.8),
        rot: Math.random() * 360,
        col: cols[i % cols.length],
        delay: Math.random() * 0.12,
        dur: 0.8 + Math.random() * 0.7,
        round: Math.random() > 0.5,
      };
    });
  }

  ngAfterViewInit(): void {
    // The elements now exist — fly them out with the Web Animations API.
    requestAnimationFrame(() => this.animate());
  }

  private animate(): void {
    const els = this.host.nativeElement.querySelectorAll<HTMLElement>('.ow-part');
    els.forEach((el, i) => {
      const p = this.parts[i];
      if (!p) return;
      el.animate(
        [
          { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 },
          { transform: `translate(${p.dx}px, ${p.dy}px) rotate(${p.rot}deg) scale(.4)`, opacity: 0 },
        ],
        {
          duration: p.dur * 1000,
          delay: p.delay * 1000,
          easing: 'cubic-bezier(.2,.7,.3,1)',
          fill: 'forwards',
        }
      );
    });
  }

  styleFor(p: Part): Record<string, string> {
    return {
      width: `${p.s}px`,
      height: `${p.s}px`,
      'border-radius': p.round ? '50%' : '3px',
      background: p.col,
      'box-shadow': `0 0 ${p.s}px ${hexA(p.col, 0.8)}`,
    };
  }
}
