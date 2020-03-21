import {
  PlayerId, ValidatedTurn, Penalty, OutPlayer, Error,
} from 'agurk-shared';

export interface RoomApi {
  readonly broadcastStartGame: (players: PlayerId[]) => void;
  readonly broadcastStartRound: (players: PlayerId[]) => void;
  readonly broadcastStartCycle: (orderedPlayers: PlayerId[]) => void;
  readonly broadcastStartPlayerTurn: (playerId: PlayerId) => void;
  readonly broadcastPlayerTurn: (turn: ValidatedTurn) => void;
  readonly broadcastEndCycle: (outPlayer: OutPlayer[], highestTurnPlayers: PlayerId[]) => void;
  readonly broadcastEndRound: (penalties: Penalty[], outPlayers: OutPlayer[], winner?: PlayerId) => void;
  readonly broadcastSuccessEndGame: (winner: PlayerId) => void;
  readonly broadcastErrorEndGame: (error: Error) => void;
}
