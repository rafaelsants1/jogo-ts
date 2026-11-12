import {
  BODY_Y,
  COIN_W,
  ELEVATED_COIN_Y,
  FEET_Y,
  GROUND_COIN_Y,
  HIGH_H,
  HIGH_W,
  JUMP_RISE,
  LOW_H,
  LOW_W,
  PLAYER_COL,
  PLAYER_H,
  PLAYER_W,
} from './config';
import type { Box, Coin, Lane, Obstacle, ObstacleKind } from './types';

/** AABB: só colide se estiver na mesma pista e os retângulos se sobrepuserem. */
export function overlaps(a: Box, b: Box): boolean {
  return (
    a.lane === b.lane &&
    a.x < b.x + b.w &&
    b.x < a.x + a.w &&
    a.y < b.y + b.h &&
    b.y < a.y + a.h
  );
}

export function obstacleWidth(kind: ObstacleKind): number {
  return kind === 'HIGH' ? HIGH_W : LOW_W;
}

export function playerBox(lane: Lane, scroll: number, jumping: boolean): Box {
  return {
    lane,
    x: scroll + PLAYER_COL,
    y: jumping ? BODY_Y - JUMP_RISE : BODY_Y,
    w: PLAYER_W,
    h: PLAYER_H,
  };
}

export function obstacleBox(o: Obstacle): Box {
  if (o.kind === 'HIGH') {
    return { lane: o.lane, x: o.x, y: BODY_Y, w: HIGH_W, h: HIGH_H };
  }
  return { lane: o.lane, x: o.x, y: FEET_Y, w: LOW_W, h: LOW_H };
}

export function coinBox(c: Coin): Box {
  return {
    lane: c.lane,
    x: c.x,
    y: c.elevated ? ELEVATED_COIN_Y : GROUND_COIN_Y,
    w: COIN_W,
    h: 1,
  };
}
