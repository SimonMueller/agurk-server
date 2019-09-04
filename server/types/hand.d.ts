import { Card } from '../../shared/types/card';

export type Hand = Card[];

export interface PlayerHands {
  readonly [playerId: string]: Hand;
}
