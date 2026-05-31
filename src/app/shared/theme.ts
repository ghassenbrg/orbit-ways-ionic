// theme.ts — chunky mobile-game palettes, character token sets, colour helpers.
// Recreated from the design bundle's orbit-theme.jsx (asset paths re-pointed to
// the Ionic app's assets/icon folder).

export type Side = 'B' | 'W';
export type PaletteName = 'Aurora' | 'Ember' | 'Reef' | 'Magenta';
export type TokenKey = 'astro' | 'cosmic' | 'worlds' | 'orb';
export type FlowMode = 'bold' | 'subtle' | 'hidden';
export type Motion = 'snappy' | 'bouncy' | 'calm';

export interface Palette {
  B: string;
  W: string;
  bg1: string;
  bg2: string;
  label: string;
}

export interface TokenSet {
  B: string;
  W: string;
  label: string;
}

// Character token sets — the original sticker art. Each pair is two clearly
// different characters so players never get confused.
export const TOKEN_SETS: Record<TokenKey, TokenSet | null> = {
  astro: { B: 'assets/icon/rocket.png', W: 'assets/icon/astronaut.png', label: 'Rocket vs Astronaut' },
  cosmic: { B: 'assets/icon/alien.png', W: 'assets/icon/planet.png', label: 'Alien vs Planet' },
  worlds: { B: 'assets/icon/mars.png', W: 'assets/icon/moon.png', label: 'Mars vs Moon' },
  orb: null,
};

export const TOKEN_KEYS: TokenKey[] = ['astro', 'cosmic', 'worlds', 'orb'];

// Candy palettes — bright, saturated, two distinct hues per theme.
export const PALETTES: Record<PaletteName, Palette> = {
  Aurora: { B: '#8a6cff', W: '#1fbcff', bg1: '#2c1f57', bg2: '#15102f', label: 'Aurora' },
  Ember: { B: '#ff8a3d', W: '#ff5d8f', bg1: '#3a1f43', bg2: '#1d1030', label: 'Ember' },
  Reef: { B: '#22cf86', W: '#ff6a52', bg1: '#163a40', bg2: '#101f2c', label: 'Reef' },
  Magenta: { B: '#ff5dc0', W: '#5b8cff', bg1: '#34174a', bg2: '#180f33', label: 'Magenta' },
};

export const PALETTE_NAMES: PaletteName[] = ['Aurora', 'Ember', 'Reef', 'Magenta'];

export const MOTION_MS: Record<Motion, number> = { snappy: 430, bouncy: 640, calm: 840 };

export function fieldBackground(p: Palette): string {
  return `radial-gradient(95% 60% at 50% 0%, ${hexA(p.B, 0.32)} 0%, transparent 55%),`
    + `radial-gradient(95% 55% at 50% 100%, ${hexA(p.W, 0.28)} 0%, transparent 55%),`
    + `linear-gradient(180deg, ${p.bg1} 0%, ${p.bg2} 60%, #0f0a24 100%)`;
}

export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  const f = amt < 0 ? 1 + amt : 1;
  r = Math.round(r * f);
  g = Math.round(g * f);
  b = Math.round(b * f);
  return `rgb(${r},${g},${b})`;
}
