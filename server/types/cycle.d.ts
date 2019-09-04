import { PlayerHands } from './hand';
import { OutPlayer, PlayerId } from '../../shared/types/player';
import { ValidatedTurn } from '../../shared/types/turn';

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
