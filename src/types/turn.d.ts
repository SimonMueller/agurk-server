import {
  Card, PlayerId, TurnError, ValidatedTurn,
} from 'agurk-shared';
import { Result } from './result';

export type Turn = {
  readonly cards: Card[];
  readonly playerId: PlayerId;
}

export type TurnResult = Result<TurnError, ValidatedTurn>
