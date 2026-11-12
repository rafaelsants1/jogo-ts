import type { Rgb } from '../game/types';
import type { Screen } from '../terminal/screen';

export const BG: Rgb = [14, 16, 26];
export const TEXT: Rgb = [225, 225, 232];
export const DIM: Rgb = [120, 125, 148];
export const ACCENT: Rgb = [250, 205, 60];
export const DANGER: Rgb = [240, 85, 75];
export const PANEL: Rgb = [28, 32, 52];
export const HUD_BG: Rgb = [34, 38, 62];
export const GROUND: Rgb = [95, 100, 130];
/** Fundo de cada pista: a de trás é mais escura, a da frente mais clara. */
export const LANE_BG: readonly [Rgb, Rgb, Rgb] = [
  [20, 23, 36],
  [25, 29, 45],
  [31, 36, 55],
];

export function drawBox(
  screen: Screen,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgb,
  bg: Rgb,
  double = false,
): void {
  const [tl, tr, bl, br, hz, vt] = double
    ? ['╔', '╗', '╚', '╝', '═', '║']
    : ['┌', '┐', '└', '┘', '─', '│'];
  screen.fill(x, y, w, h, ' ', TEXT, bg);
  for (let i = 1; i < w - 1; i++) {
    screen.set(x + i, y, hz, color);
    screen.set(x + i, y + h - 1, hz, color);
  }
  for (let j = 1; j < h - 1; j++) {
    screen.set(x, y + j, vt, color);
    screen.set(x + w - 1, y + j, vt, color);
  }
  screen.set(x, y, tl, color);
  screen.set(x + w - 1, y, tr, color);
  screen.set(x, y + h - 1, bl, color);
  screen.set(x + w - 1, y + h - 1, br, color);
}

/** Quebra um texto em linhas de até `width` colunas (para telas estreitas). */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line.length === 0 ? word : `${line} ${word}`;
    if ([...candidate].length <= width || line.length === 0) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}
