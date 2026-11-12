/** Cor truecolor [R, G, B], cada canal de 0 a 255. */
export type Rgb = readonly [number, number, number];

/** Ações abstratas vindas do teclado. Cada tecla gera um evento discreto. */
export type Action =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'JUMP'
  | 'CONFIRM'
  | 'PAUSE'
  | 'QUIT'
  | 'MENU';

/** 0 = pista de cima (fundo), 1 = meio, 2 = pista de baixo (frente). */
export type Lane = 0 | 1 | 2;

/** LOW = cavalete (pode ser pulado). HIGH = ônibus (não pode ser pulado). */
export type ObstacleKind = 'LOW' | 'HIGH';

export interface Obstacle {
  readonly kind: ObstacleKind;
  readonly lane: Lane;
  /** Coluna do mundo onde fica a borda esquerda do obstáculo. */
  readonly x: number;
  /** Já colidiu com o jogador; não conta uma segunda vez. */
  readonly hit: boolean;
}

export interface Coin {
  readonly lane: Lane;
  /** Coluna do mundo onde fica a borda esquerda da coin. */
  readonly x: number;
  /** Coin elevada: só é pega pulando. */
  readonly elevated: boolean;
}

/**
 * off      = fora da tela
 * entering = entrando pela borda esquerda
 * chasing  = correndo 4 colunas atrás do jogador
 * leaving  = ficou para trás e está saindo da tela
 */
export type VillainPhase = 'off' | 'entering' | 'chasing' | 'leaving';

export interface VillainState {
  readonly phase: VillainPhase;
  /** Coluna da TELA da borda esquerda do vilão (ele acompanha o jogador, não o mundo). */
  readonly x: number;
  /** Tempo desde o último tropeço, em ms. */
  readonly calmMs: number;
}

export type GameOverCause = 'crash' | 'caught';

export interface GameState {
  readonly lane: Lane;
  /** Tempo restante de pulo em ms; 0 = no chão. */
  readonly jumpMs: number;
  /** Colunas roladas desde o início (1 coluna = 1 metro). */
  readonly scroll: number;
  readonly coins: number;
  readonly obstacles: readonly Obstacle[];
  readonly coinItems: readonly Coin[];
  readonly villain: VillainState;
  readonly paused: boolean;
  readonly over: GameOverCause | null;
  /** Estado do RNG semeado usado pelo spawner. */
  readonly rng: number;
  /** Coluna do mundo onde começa o próximo bloco gerado. */
  readonly nextSpawnX: number;
  /** Tempo de jogo decorrido (sem pausa), usado para animação. */
  readonly timeMs: number;
}

/** Retângulo de colisão. y é a linha dentro da faixa da pista (0 = topo da faixa). */
export interface Box {
  readonly lane: Lane;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
