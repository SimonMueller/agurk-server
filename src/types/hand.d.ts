import { Card } from 'agurk-shared';

export type Hand = Card[];

export interface PlayerHands {
  readonly [playerId: string]: Hand;
}
