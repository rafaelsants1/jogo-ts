import type { Action, Coin, GameState, Obstacle } from '../src/game/types';
import { createGame, update } from '../src/game/update';

export const TICK = 1000 / 30;

/** Estado inicial sem spawner (mundo vazio), com entidades controladas pelo teste. */
export function makeState(
  obstacles: Obstacle[] = [],
  coinItems: Coin[] = [],
  overrides: Partial<GameState> = {},
): GameState {
  return { ...createGame(1), nextSpawnX: Number.POSITIVE_INFINITY, obstacles, coinItems, ...overrides };
}

/** Roda `ticks` ticks; `actionsAt(t)` devolve as ações do tick t (começando em 0). */
export function run(
  state: GameState,
  ticks: number,
  actionsAt: (t: number) => Action[] = () => [],
): GameState {
  let s = state;
  for (let t = 0; t < ticks; t++) s = update(s, actionsAt(t), TICK);
  return s;
}
