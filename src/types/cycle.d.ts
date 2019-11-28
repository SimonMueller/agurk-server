import { OutPlayer, PlayerId, ValidatedTurn } from 'agurk-shared';
import { PlayerHands } from './hand';

export interface CycleState {
  readonly turns: ValidatedTurn[];
  readonly hands: PlayerHands;
  readonly playerIds: PlayerId[];
  readonly outPlayers: OutPlayer[];
}

interface FinishedCycle {
  readonly highestTurns: ValidatedTurn[];
  readonly lowestTurns: ValidatedTurn[];
}

export type Cycle = FinishedCycle & CycleState;
