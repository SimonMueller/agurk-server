import {
  Card, PlayerId,
} from 'agurk-shared';

export type Turn = {
  readonly cards: Card[];
  readonly playerId: PlayerId;
}
