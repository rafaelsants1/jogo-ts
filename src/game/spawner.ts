import {
  CHUNK_LEN,
  CHUNK_MARGIN,
  COIN_SPACING,
  COIN_W,
  HIGH_W,
  LOW_W,
} from './config';
import type { Coin, Lane, Obstacle } from './types';

/** RNG determinístico (mulberry32). Mesma seed = mesma sequência. */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  get state(): number {
    return this.s;
  }

  /** Número em [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro em [min, max]. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: lista vazia');
    return items[this.int(0, items.length - 1)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }
}

export interface Chunk {
  readonly obstacles: Obstacle[];
  readonly coins: Coin[];
  /** Estado do RNG depois de gerar este bloco. */
  readonly rng: number;
  /** Coluna do mundo onde começa o próximo bloco. */
  readonly nextX: number;
}

const LANES: readonly Lane[] = [0, 1, 2];

/**
 * Gera um bloco de CHUNK_LEN colunas começando em startX.
 *
 * Garantia de solução: no máximo 2 das 3 pistas recebem obstáculo ALTO, e os
 * ALTOS ficam dentro de [startX + CHUNK_MARGIN, startX + CHUNK_LEN - CHUNK_MARGIN),
 * então blocos vizinhos nunca se sobrepõem e sempre há uma janela para trocar
 * de pista entre eles. Logo, em qualquer coluna existe ao menos uma pista sem ALTO.
 */
export function spawnChunk(rngState: number, startX: number): Chunk {
  const rng = new Rng(rngState);
  const order = rng.shuffle(LANES);

  const roll = rng.next();
  const highCount = roll < 0.3 ? 0 : roll < 0.75 ? 1 : 2;

  const obstacles: Obstacle[] = [];
  const lowX = new Map<Lane, number>();

  for (let i = 0; i < order.length; i++) {
    const lane = order[i] as Lane;
    if (i < highCount) {
      const x = startX + rng.int(CHUNK_MARGIN, CHUNK_LEN - CHUNK_MARGIN - HIGH_W);
      obstacles.push({ kind: 'HIGH', lane, x, hit: false });
    } else if (rng.next() < 0.5) {
      const x = startX + rng.int(CHUNK_MARGIN, CHUNK_LEN - CHUNK_MARGIN - LOW_W);
      obstacles.push({ kind: 'LOW', lane, x, hit: false });
      lowX.set(lane, x);
    }
  }

  // Coins vão sempre numa pista sem obstáculo ALTO neste bloco.
  const freeLanes = order.slice(highCount);
  const coinLane = rng.pick(freeLanes);
  const count = rng.int(3, 6);
  const rowLen = (count - 1) * COIN_SPACING + COIN_W;
  const overLow = lowX.get(coinLane);

  let elevated: boolean;
  let firstX: number;
  if (overLow !== undefined) {
    // Fileira elevada centrada sobre o cavalete: recompensa o pulo.
    elevated = true;
    firstX = overLow + Math.floor((LOW_W - rowLen) / 2);
  } else {
    elevated = rng.next() < 0.3;
    firstX = startX + rng.int(2, CHUNK_LEN - rowLen - 2);
  }

  const coins: Coin[] = [];
  for (let k = 0; k < count; k++) {
    coins.push({ lane: coinLane, x: firstX + k * COIN_SPACING, elevated });
  }

  return { obstacles, coins, rng: rng.state, nextX: startX + CHUNK_LEN };
}
