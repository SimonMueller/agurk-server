import {
  OutPlayer, PlayerId, ValidatedTurn, ValidTurn,
} from 'agurk-shared';
import { PlayerHands } from './hand';

export interface CycleState {
  readonly turns: ValidatedTurn[];
  readonly hands: PlayerHands;
  readonly playerIds: PlayerId[];
  readonly outPlayers: OutPlayer[];
}

interface FinishedCycle {
  readonly highestTurns: ValidTurn[];
  readonly lowestTurns: ValidTurn[];
}

export type Cycle = FinishedCycle & CycleState;
