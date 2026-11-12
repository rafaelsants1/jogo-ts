import type { Rgb } from '../game/types';

/*
 * Todos os dados de personagem ficam aqui. Regras dos sprites:
 * - só ASCII imprimível e box-drawing/blocos (U+2500 a U+259F), sem emoji;
 * - jogador e vilão: 3 linhas x 5 colunas; coin: 1x3; obstáculo baixo: 1x4; alto: 3x10;
 * - espaço = célula transparente.
 * Os três personagens têm a mesma estrutura: 2 quadros de corrida, 3 cores por linha,
 * 1 coin e 1 vilão com 2 quadros. Nada de falas: só nomes e rótulos.
 */

export type CharacterId = 'bolsonaro' | 'lula' | 'renan';

/** Sprite animado de 3x5 com uma cor por linha (cabeça, tronco, pernas). */
export interface RunnerSprite {
  readonly frames: readonly (readonly string[])[];
  readonly rowColors: readonly [Rgb, Rgb, Rgb];
}

export interface CoinDef {
  readonly sprite: readonly string[];
  readonly color: Rgb;
  /** Rótulo no HUD, ex.: "FUZIS". */
  readonly label: string;
}

export interface VillainDef extends RunnerSprite {
  readonly name: string;
  /** Complemento da mensagem de game over quando o vilão alcança: "{name} {caughtText}". */
  readonly caughtText: string;
}

export interface CharacterDef {
  readonly id: CharacterId;
  /** Nome no menu. */
  readonly name: string;
  /** Nome no HUD. */
  readonly hudName: string;
  /** Traço de cor característico. */
  readonly color: Rgb;
  readonly player: RunnerSprite;
  readonly coin: CoinDef;
  readonly villain: VillainDef;
}

export interface ObstacleDef {
  readonly sprite: readonly string[];
  readonly color: Rgb;
}

const SKIN: Rgb = [232, 188, 150];
const PANTS: Rgb = [70, 80, 120];

/** Pernas alternando entre os dois quadros de corrida. */
const LEGS_A = ' / \\ ';
const LEGS_B = ' | | ';

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'bolsonaro',
    name: 'Jair Bolsonaro (Mito)',
    hudName: 'JAIR BOLSONARO',
    color: [60, 180, 80],
    player: {
      frames: [
        [' (o) ', '<[╲]>', LEGS_A],
        [' (o) ', '<[╲]>', LEGS_B],
      ],
      rowColors: [SKIN, [60, 180, 80], PANTS],
    },
    coin: { sprite: ['═╦─'], color: [150, 150, 160], label: 'FUZIS' },
    villain: {
      name: 'Alexandre de Moraes',
      caughtText: 'te censurou!',
      frames: [
        [' (O) ', '<[▓]>', LEGS_A],
        [' (O) ', '<[▓]>', LEGS_B],
      ],
      rowColors: [SKIN, [150, 150, 170], [90, 90, 110]],
    },
  },
  {
    id: 'lula',
    name: 'Lula',
    hudName: 'LULA',
    color: [220, 55, 55],
    player: {
      frames: [
        [' {o} ', '<[▄]>', LEGS_A],
        [' {o} ', '<[▄]>', LEGS_B],
      ],
      rowColors: [SKIN, [220, 55, 55], PANTS],
    },
    coin: { sprite: ['(▓)'], color: [205, 80, 65], label: 'PICANHAS' },
    villain: {
      name: 'Petrolão',
      caughtText: 'te prendeu!',
      frames: [
        ['╔o═o╗', '║▒▒▒║', LEGS_A],
        ['╔o═o╗', '║▒▒▒║', LEGS_B],
      ],
      rowColors: [[170, 170, 190], [120, 125, 150], [90, 90, 110]],
    },
  },
  {
    id: 'renan',
    name: 'Renan Santos',
    hudName: 'RENAN SANTOS',
    color: [240, 145, 35],
    player: {
      frames: [
        [' [o] ', '<[▀]>', LEGS_A],
        [' [o] ', '<[▀]>', LEGS_B],
      ],
      rowColors: [SKIN, [240, 145, 35], PANTS],
    },
    coin: { sprite: ['▚o▞'], color: [230, 175, 45], label: 'ONÇAS' },
    villain: {
      name: 'Flávio Bolsonaro',
      caughtText: 'te miliciou!',
      frames: [
        [' (o) ', '<[║]>', LEGS_A],
        [' (o) ', '<[║]>', LEGS_B],
      ],
      rowColors: [SKIN, [70, 120, 200], [90, 90, 110]],
    },
  },
];

export const OBSTACLES: { readonly LOW: ObstacleDef; readonly HIGH: ObstacleDef } = {
  /** Cavalete. */
  LOW: { sprite: ['╱══╲'], color: [235, 120, 50] },
  /** Ônibus. */
  HIGH: {
    sprite: ['┌────────┐', '│▒▒│▒▒│▒▒│', '└O──────O┘'],
    color: [235, 195, 50],
  },
};

export function characterAt(index: number): CharacterDef {
  const ch = CHARACTERS[index];
  if (ch === undefined) throw new Error(`Personagem inexistente: índice ${index}`);
  return ch;
}
