import type { Lane } from './types';

/** Velocidade constante do mundo (colunas por segundo). */
export const SPEED_COLS_PER_S = 20;

/** Coluna fixa da tela onde o jogador corre. */
export const PLAYER_COL = 10;
export const PLAYER_W = 5;
export const PLAYER_H = 3;
export const START_LANE: Lane = 1;

export const JUMP_MS = 600;
/** Quantas linhas o sprite sobe durante o pulo. */
export const JUMP_RISE = 2;

/* Layout vertical de uma faixa de pista (linha 0 = topo da faixa). */
/** Linhas de cada faixa: 2 de espaço para o pulo, 3 de corpo, 1 de chão, 1 de separação. */
export const LANE_ROWS = 7;
/** Primeira linha do corpo do jogador em pé. */
export const BODY_Y = 2;
/** Linha dos pés (onde fica o obstáculo baixo). */
export const FEET_Y = BODY_Y + PLAYER_H - 1;
/** Linha do chão desenhado. */
export const GROUND_Y = FEET_Y + 1;
/** Coin no nível do chão: altura do corpo em pé (não é pega durante o pulo). */
export const GROUND_COIN_Y = 3;
/** Coin elevada: só a hitbox do pulo (linhas 0..2) alcança. */
export const ELEVATED_COIN_Y = 1;

export const LOW_W = 4;
export const LOW_H = 1;
export const HIGH_W = 10;
export const HIGH_H = 3;

export const COIN_W = 3;
/** Distância entre o início de uma coin e o da próxima na fileira. */
export const COIN_SPACING = 4;
export const COIN_VALUE = 1;
export const COIN_SCORE = 10;

/** Colunas livres entre o vilão e o jogador. */
export const VILLAIN_GAP = 4;
export const VILLAIN_CHASE_COL = PLAYER_COL - VILLAIN_GAP - PLAYER_W;
export const VILLAIN_OFF_COL = -PLAYER_W - 1;
export const VILLAIN_CALM_MS = 8000;
export const VILLAIN_ENTER_SPEED = 30;
export const VILLAIN_LEAVE_SPEED = 12;

/* Spawner */
export const CHUNK_LEN = 40;
/** Margem sem obstáculo ALTO no início e no fim de cada bloco (garante troca de pista). */
export const CHUNK_MARGIN = 6;
export const FIRST_SPAWN_X = 70;
/** Quantas colunas à frente do jogador o mundo já fica gerado. */
export const SPAWN_AHEAD = 320;
/** Entidades que ficaram tantas colunas para trás são descartadas. */
export const DESPAWN_BEHIND = 20;
