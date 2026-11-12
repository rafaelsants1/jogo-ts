import type { Action, Rgb } from '../game/types';
import type { Screen } from '../terminal/screen';
import type { Scene, Transition } from './scene';
import { BG } from './ui';

/**
 * Base comum das cenas (template method):
 * - `tick` acumula o tempo da cena e delega para `onTick`;
 * - `render` limpa o fundo e delega para `draw`.
 * As subclasses implementam só o que é específico delas.
 */
export abstract class BaseScene implements Scene {
  /** Tempo desde que a cena começou, em ms (usado para animações). */
  protected elapsedMs = 0;

  /** Cor de fundo da cena. Subclasses podem sobrescrever. */
  protected get background(): Rgb {
    return BG;
  }

  tick(actions: readonly Action[], dtMs: number): Transition | null {
    this.elapsedMs += dtMs;
    return this.onTick(actions, dtMs);
  }

  render(screen: Screen): void {
    screen.clear(this.background);
    this.draw(screen);
  }

  protected abstract onTick(actions: readonly Action[], dtMs: number): Transition | null;

  protected abstract draw(screen: Screen): void;
}
