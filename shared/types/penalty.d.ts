import { Card } from './card';
import { PlayerId } from './player';

export interface Penalty {
  readonly card: Card;
  readonly playerId: PlayerId;
}
