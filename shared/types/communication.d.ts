import { OutPlayer, PlayerId } from './player';
import { Penalty } from './penalty';
import { Card } from './card';
import { ValidatedTurn } from './turn';
import { Turn, TurnError } from '../../server/types/turn';

interface Error {
  readonly error: string;
}

export type SendableError = Error | TurnError;

export type Sendable = PlayerId | PlayerId[] | OutPlayer | OutPlayer[] | Penalty |
  Penalty[] | Card | Card[] | ValidatedTurn | ValidatedTurn[] | Turn | Turn[] | SendableError;
