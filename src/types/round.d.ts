import { OutPlayer, PlayerId, Penalty } from 'agurk-shared';
import { Cycle } from './cycle';
import { HandsByPlayerId } from './hand';

export interface RoundState {
  readonly initialHands: HandsByPlayerId;
  readonly cycles: Cycle[];
  readonly playerIds: PlayerId[];
  readonly outPlayers: OutPlayer[];
}

interface FinishedRound {
  readonly winner?: PlayerId;
  readonly penalties: Penalty[];
}

export type Round = FinishedRound & RoundState;
