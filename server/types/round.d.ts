import { OutPlayer, PlayerId } from '../../shared/types/player';
import { Penalty } from '../../shared/types/penalty';
import { Cycle } from './cycle';
import { PlayerHands } from './hand';

export interface RoundState {
  readonly initialHands: PlayerHands;
  readonly cycles: Cycle[];
  readonly playerIds: PlayerId[];
  readonly outPlayers: OutPlayer[];
}

interface FinishedRound {
  readonly winner: PlayerId;
  readonly penalties: Penalty[];
}

export type Round = FinishedRound & RoundState;
