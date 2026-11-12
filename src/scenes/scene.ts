import type { Action, GameOverCause } from '../game/types';
import type { Screen } from '../terminal/screen';

export interface RunResult {
  readonly characterIndex: number;
  readonly cause: GameOverCause;
  readonly score: number;
  readonly coins: number;
  readonly distance: number;
}

export type Transition =
  | { readonly to: 'menu'; readonly selected: number }
  | { readonly to: 'play'; readonly characterIndex: number }
  | { readonly to: 'gameover'; readonly result: RunResult };

/**
 * Contrato que o main.ts conhece: qualquer cena sabe avançar um tick e se desenhar.
 * A implementação base fica em `base-scene.ts` (classe abstrata BaseScene).
 */
export interface Scene {
  /** Um tick de jogo. Devolve uma transição para trocar de cena, ou null. */
  tick(actions: readonly Action[], dtMs: number): Transition | null;
  render(screen: Screen): void;
}
