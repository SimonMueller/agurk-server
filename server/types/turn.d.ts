import { Card } from '../../shared/types/card';
import { PlayerId } from '../../shared/types/player';
import { ValidatedTurn } from '../../shared/types/turn';
import { Result } from './result';

export type TurnError = {
  readonly playerId: PlayerId;
  readonly message: string;
}

export type Turn = {
  readonly cards: Card[];
  readonly playerId: PlayerId;
}

export type TurnResult = Result<TurnError, ValidatedTurn>
