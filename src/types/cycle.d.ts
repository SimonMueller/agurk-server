import {
  OutPlayer, PlayerId, ValidatedTurn, ValidTurn,
} from 'agurk-shared';
import { HandsByPlayerId } from './hand';

export interface CycleState {
  readonly turns: ValidatedTurn[];
  readonly hands: HandsByPlayerId;
  readonly playerIds: PlayerId[];
  readonly outPlayers: OutPlayer[];
}

interface FinishedCycle {
  readonly highestTurns: ValidTurn[];
  readonly lowestTurns: ValidTurn[];
}

export type Cycle = FinishedCycle & CycleState;
