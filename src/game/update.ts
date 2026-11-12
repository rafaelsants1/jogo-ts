import { coinBox, obstacleBox, obstacleWidth, overlaps, playerBox } from './collision';
import {
  COIN_SCORE,
  COIN_VALUE,
  COIN_W,
  DESPAWN_BEHIND,
  FIRST_SPAWN_X,
  JUMP_MS,
  SPAWN_AHEAD,
  SPEED_COLS_PER_S,
  START_LANE,
  VILLAIN_CALM_MS,
  VILLAIN_CHASE_COL,
  VILLAIN_ENTER_SPEED,
  VILLAIN_LEAVE_SPEED,
  VILLAIN_OFF_COL,
} from './config';
import { spawnChunk } from './spawner';
import type {
  Action,
  Coin,
  GameOverCause,
  GameState,
  Lane,
  Obstacle,
  VillainState,
} from './types';

const EPS = 1e-6;

export function createGame(seed: number): GameState {
  return {
    lane: START_LANE,
    jumpMs: 0,
    scroll: 0,
    coins: 0,
    obstacles: [],
    coinItems: [],
    villain: { phase: 'off', x: VILLAIN_OFF_COL, calmMs: 0 },
    paused: false,
    over: null,
    rng: seed >>> 0,
    nextSpawnX: FIRST_SPAWN_X,
    timeMs: 0,
  };
}

export function isJumping(state: Pick<GameState, 'jumpMs'>): boolean {
  return state.jumpMs > EPS;
}

/** Distância em metros (1 m = 1 coluna rolada). */
export function distanceOf(state: Pick<GameState, 'scroll'>): number {
  return Math.floor(state.scroll + EPS);
}

export function scoreOf(state: Pick<GameState, 'scroll' | 'coins'>): number {
  return distanceOf(state) + COIN_SCORE * state.coins;
}

/** O vilão conta como "ativo" enquanto entra ou persegue. Saindo, já não pega ninguém. */
export function isVillainActive(v: VillainState): boolean {
  return v.phase === 'entering' || v.phase === 'chasing';
}

function clampLane(n: number): Lane {
  if (n <= 0) return 0;
  if (n >= 2) return 2;
  return 1;
}

export function stepVillain(v: VillainState, dtMs: number): VillainState {
  const dt = dtMs / 1000;
  switch (v.phase) {
    case 'off':
      return v;
    case 'entering':
    case 'chasing': {
      const calmMs = v.calmMs + dtMs;
      if (calmMs >= VILLAIN_CALM_MS - EPS) {
        return { phase: 'leaving', x: v.x, calmMs };
      }
      const x = Math.min(VILLAIN_CHASE_COL, v.x + VILLAIN_ENTER_SPEED * dt);
      return { phase: x >= VILLAIN_CHASE_COL ? 'chasing' : 'entering', x, calmMs };
    }
    case 'leaving': {
      const x = v.x - VILLAIN_LEAVE_SPEED * dt;
      if (x <= VILLAIN_OFF_COL) return { phase: 'off', x: VILLAIN_OFF_COL, calmMs: 0 };
      return { phase: 'leaving', x, calmMs: v.calmMs };
    }
  }
}

/**
 * Avança o jogo um tick. Função pura: não lê relógio, não faz I/O.
 * `actions` são as ações acumuladas desde o último tick, na ordem em que chegaram.
 */
export function update(state: GameState, actions: readonly Action[], dtMs: number): GameState {
  if (state.over !== null) return state;

  let paused = state.paused;
  let lane = state.lane;
  let jumpMs = state.jumpMs;

  for (const action of actions) {
    if (action === 'PAUSE') {
      paused = !paused;
      continue;
    }
    if (paused) continue;
    switch (action) {
      case 'UP':
        lane = clampLane(lane - 1);
        break;
      case 'DOWN':
        lane = clampLane(lane + 1);
        break;
      case 'JUMP':
        // Sem pulo duplo: só pula quem está no chão.
        if (jumpMs <= EPS) jumpMs = JUMP_MS;
        break;
      default:
        break;
    }
  }

  if (paused) return { ...state, paused, lane, jumpMs };

  const timeMs = state.timeMs + dtMs;
  const scroll = state.scroll + (SPEED_COLS_PER_S * dtMs) / 1000;

  // Descarta o que ficou para trás e gera o que falta à frente.
  const minX = scroll - DESPAWN_BEHIND;
  const obstacles: Obstacle[] = state.obstacles.filter((o) => o.x + obstacleWidth(o.kind) > minX);
  const spawnedCoins: Coin[] = state.coinItems.filter((c) => c.x + COIN_W > minX);
  let rng = state.rng;
  let nextSpawnX = state.nextSpawnX;
  while (nextSpawnX < scroll + SPAWN_AHEAD) {
    const chunk = spawnChunk(rng, nextSpawnX);
    obstacles.push(...chunk.obstacles);
    spawnedCoins.push(...chunk.coins);
    rng = chunk.rng;
    nextSpawnX = chunk.nextX;
  }

  // Colisões (o pulo conta durante todo o tick em que ainda resta tempo de pulo).
  const player = playerBox(lane, scroll, jumpMs > EPS);
  let over: GameOverCause | null = null;
  let tripped = false;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i] as Obstacle;
    if (o.hit || !overlaps(player, obstacleBox(o))) continue;
    obstacles[i] = { ...o, hit: true };
    if (o.kind === 'HIGH') over = 'crash';
    else tripped = true;
  }

  let collected = 0;
  const coinItems = spawnedCoins.filter((c) => {
    if (overlaps(player, coinBox(c))) {
      collected += 1;
      return false;
    }
    return true;
  });

  // Vilão: primeiro tropeço chama, segundo tropeço com ele ativo encerra.
  let villain = state.villain;
  if (over === null && tripped) {
    if (isVillainActive(villain)) {
      over = 'caught';
    } else {
      const x = villain.phase === 'leaving' ? villain.x : VILLAIN_OFF_COL;
      villain = { phase: 'entering', x, calmMs: 0 };
    }
  }
  if (over === null) villain = stepVillain(villain, dtMs);

  return {
    lane,
    jumpMs: Math.max(0, jumpMs - dtMs),
    scroll,
    coins: state.coins + collected * COIN_VALUE,
    obstacles,
    coinItems,
    villain,
    paused,
    over,
    rng,
    nextSpawnX,
    timeMs,
  };
}
