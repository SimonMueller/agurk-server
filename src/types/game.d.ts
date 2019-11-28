import { OutPlayer, PlayerId } from 'agurk-shared';
import { Result } from './result';
import { Round } from './round';

export interface GameState {
  readonly playerIds: PlayerId[];
  readonly rounds: Round[];
  readonly outPlayers: OutPlayer[];
}

export type MinPlayerCount = 2;

export type MaxPlayerCount = 7;

export type PenaltySumThreshold = 21;

export type CardCountToDeal = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FinishedGame {
  readonly winner: PlayerId;
}

export type Game = FinishedGame & GameState;

export interface GameError {
  readonly gameState: GameState;
  readonly message: string;
}

export type GameResult = Result<GameError, Game>;
