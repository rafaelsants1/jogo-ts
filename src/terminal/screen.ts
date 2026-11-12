import type { Rgb } from '../game/types';

const DEFAULT_FG = 0xdcdce6;
const DEFAULT_BG = 0x0e101a;

export function packRgb(c: Rgb): number {
  return ((c[0] & 255) << 16) | ((c[1] & 255) << 8) | (c[2] & 255);
}

/** Largura em células de um texto (todos os caracteres usados têm largura 1). */
export function textWidth(s: string): number {
  return [...s].length;
}

/** Destino mínimo da renderização. `process.stdout` satisfaz esta interface. */
export interface Output {
  write(data: string): unknown;
}

/**
 * Buffer de células (char, fg, bg) com diff contra o frame anterior.
 * Cada flush emite um único write só com as células que mudaram.
 */
export class Screen {
  private w = 0;
  private h = 0;
  private chars: string[] = [];
  private fgs = new Int32Array(0);
  private bgs = new Int32Array(0);
  private prevChars: string[] = [];
  private prevFgs = new Int32Array(0);
  private prevBgs = new Int32Array(0);
  private needsClear = true;

  constructor(
    private readonly out: Output,
    width: number,
    height: number,
  ) {
    this.resize(width, height);
  }

  get width(): number {
    return this.w;
  }

  get height(): number {
    return this.h;
  }

  /** Realoca os buffers e força limpeza total + redesenho no próximo flush. */
  resize(width: number, height: number): void {
    this.w = Math.max(1, Math.floor(width));
    this.h = Math.max(1, Math.floor(height));
    const n = this.w * this.h;
    this.chars = new Array<string>(n).fill(' ');
    this.fgs = new Int32Array(n).fill(DEFAULT_FG);
    this.bgs = new Int32Array(n).fill(DEFAULT_BG);
    this.prevChars = new Array<string>(n).fill('');
    this.prevFgs = new Int32Array(n).fill(-1);
    this.prevBgs = new Int32Array(n).fill(-1);
    this.needsClear = true;
  }

  /** Limpa o buffer de trabalho (não escreve nada no terminal). */
  clear(bg: Rgb): void {
    this.chars.fill(' ');
    this.fgs.fill(DEFAULT_FG);
    this.bgs.fill(packRgb(bg));
  }

  /** Escreve uma célula. Sem `bg`, mantém o fundo que já estava ali. */
  set(x: number, y: number, ch: string, fg: Rgb, bg?: Rgb): void {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return;
    const i = cy * this.w + cx;
    this.chars[i] = ch;
    this.fgs[i] = packRgb(fg);
    if (bg !== undefined) this.bgs[i] = packRgb(bg);
  }

  text(x: number, y: number, str: string, fg: Rgb, bg?: Rgb): void {
    let cx = x;
    for (const ch of str) {
      this.set(cx, y, ch, fg, bg);
      cx++;
    }
  }

  textCentered(y: number, str: string, fg: Rgb, bg?: Rgb): void {
    this.text(Math.floor((this.w - textWidth(str)) / 2), y, str, fg, bg);
  }

  fill(x: number, y: number, w: number, h: number, ch: string, fg: Rgb, bg: Rgb): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch, fg, bg);
    }
  }

  /** Desenha um sprite de uma cor só. Espaço = célula transparente. */
  sprite(x: number, y: number, lines: readonly string[], color: Rgb): void {
    lines.forEach((line, row) => this.spriteLine(x, y + row, line, color));
  }

  /** Desenha um sprite com uma cor por linha. Espaço = célula transparente. */
  spriteRows(x: number, y: number, lines: readonly string[], colors: readonly Rgb[]): void {
    lines.forEach((line, row) => {
      const color = colors[row] ?? colors[colors.length - 1];
      if (color !== undefined) this.spriteLine(x, y + row, line, color);
    });
  }

  private spriteLine(x: number, y: number, line: string, color: Rgb): void {
    let cx = x;
    for (const ch of line) {
      if (ch !== ' ') this.set(cx, y, ch, color);
      cx++;
    }
  }

  /**
   * Compara com o frame anterior e emite só o que mudou, num único write.
   * Células vizinhas na mesma linha não repetem o posicionamento do cursor e
   * só trocam de cor quando a cor muda.
   */
  flush(): void {
    let out = '';
    if (this.needsClear) {
      out += '\x1b[0m\x1b[2J';
      this.needsClear = false;
    }
    let curFg = -1;
    let curBg = -1;
    let cursorX = -1;
    let cursorY = -1;
    for (let y = 0; y < this.h; y++) {
      const rowStart = y * this.w;
      for (let x = 0; x < this.w; x++) {
        const i = rowStart + x;
        const ch = this.chars[i] as string;
        const fg = this.fgs[i] as number;
        const bg = this.bgs[i] as number;
        if (ch === this.prevChars[i] && fg === this.prevFgs[i] && bg === this.prevBgs[i]) continue;
        if (x !== cursorX || y !== cursorY) out += `\x1b[${y + 1};${x + 1}H`;
        if (fg !== curFg) {
          out += `\x1b[38;2;${(fg >> 16) & 255};${(fg >> 8) & 255};${fg & 255}m`;
          curFg = fg;
        }
        if (bg !== curBg) {
          out += `\x1b[48;2;${(bg >> 16) & 255};${(bg >> 8) & 255};${bg & 255}m`;
          curBg = bg;
        }
        out += ch;
        cursorX = x + 1;
        cursorY = y;
        this.prevChars[i] = ch;
        this.prevFgs[i] = fg;
        this.prevBgs[i] = bg;
      }
    }
    if (out.length > 0) this.out.write(out);
  }
}

/* ---------- Ciclo de vida do TTY ---------- */

let terminalActive = false;

/** Tela alternativa, cursor escondido, sem quebra automática de linha e stdin em modo raw. */
export function enterTerminal(): void {
  if (terminalActive) return;
  terminalActive = true;
  process.stdout.write('\x1b[?1049h\x1b[?25l\x1b[?7l\x1b[0m\x1b[2J');
  process.stdin.setRawMode(true);
}

/** Desfaz enterTerminal na ordem inversa. Idempotente: pode ser chamada de qualquer caminho de saída. */
export function restoreTerminal(): void {
  if (!terminalActive) return;
  terminalActive = false;
  try {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
  } catch {
    // stdin já fechado: nada a restaurar.
  }
  try {
    process.stdout.write('\x1b[0m\x1b[?7h\x1b[?25h\x1b[?1049l');
  } catch {
    // stdout já fechado: nada a restaurar.
  }
}
