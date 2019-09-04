import { Card } from './card';
import { PlayerId } from './player';

export interface ValidatedTurn {
  readonly cards: Card[];
  readonly playerId: PlayerId;
  readonly valid: boolean;
}
