import type { Action } from '../game/types';

const ESCAPE_SEQUENCES: ReadonlyArray<readonly [string, Action]> = [
  ['\x1b[A', 'UP'],
  ['\x1bOA', 'UP'],
  ['\x1b[B', 'DOWN'],
  ['\x1bOB', 'DOWN'],
  ['\x1b[C', 'RIGHT'],
  ['\x1bOC', 'RIGHT'],
  ['\x1b[D', 'LEFT'],
  ['\x1bOD', 'LEFT'],
];

const SINGLE_KEYS: ReadonlyMap<string, Action> = new Map<string, Action>([
  ['w', 'UP'],
  ['W', 'UP'],
  ['s', 'DOWN'],
  ['S', 'DOWN'],
  ['a', 'LEFT'],
  ['A', 'LEFT'],
  ['d', 'RIGHT'],
  ['D', 'RIGHT'],
  [' ', 'JUMP'],
  ['\r', 'CONFIRM'],
  ['\n', 'CONFIRM'],
  ['p', 'PAUSE'],
  ['P', 'PAUSE'],
  ['m', 'MENU'],
  ['M', 'MENU'],
  ['q', 'QUIT'],
  ['Q', 'QUIT'],
  ['\x03', 'QUIT'], // Ctrl+C chega como byte no modo raw
]);

/** Pula uma sequência de escape desconhecida (ex.: F1, Home) para não virar teclas soltas. */
function skipEscape(data: string, i: number): number {
  const intro = data[i + 1];
  if (intro !== '[' && intro !== 'O') return i + 1;
  let j = i + 2;
  while (j < data.length) {
    const code = data.charCodeAt(j);
    if (code >= 0x40 && code <= 0x7e) return j + 1; // byte final
    j++;
  }
  return j;
}

/** Converte bytes crus do stdin em ações abstratas, na ordem em que chegaram. */
export function parseKeys(data: string): Action[] {
  const out: Action[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === '\x1b') {
      const match = ESCAPE_SEQUENCES.find(([seq]) => data.startsWith(seq, i));
      if (match) {
        out.push(match[1]);
        i += match[0].length;
      } else {
        i = skipEscape(data, i);
      }
      continue;
    }
    const action = SINGLE_KEYS.get(data[i] as string);
    if (action !== undefined) out.push(action);
    i++;
  }
  return out;
}

/**
 * Fila de ações. O terminal não emite keyup: cada tecla (inclusive a repetição
 * automática de tecla segurada) vira um evento discreto, consumido uma vez.
 */
export class InputQueue {
  private queue: Action[] = [];
  private stream: NodeJS.ReadStream | null = null;
  private readonly onData = (chunk: Buffer | string): void => {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    this.queue.push(...parseKeys(text));
  };

  attach(stream: NodeJS.ReadStream): void {
    if (this.stream !== null) return;
    this.stream = stream;
    stream.on('data', this.onData);
    stream.resume();
  }

  detach(): void {
    if (this.stream === null) return;
    this.stream.off('data', this.onData);
    this.stream.pause();
    this.stream = null;
  }

  push(action: Action): void {
    this.queue.push(action);
  }

  /** Devolve e esvazia tudo o que chegou desde a última chamada. */
  drain(): Action[] {
    const actions = this.queue;
    this.queue = [];
    return actions;
  }
}
