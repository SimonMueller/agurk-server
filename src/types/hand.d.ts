import { Card } from 'agurk-shared';

export type Hand = Card[];

export interface HandsByPlayerId {
  readonly [playerId: string]: Hand;
}
