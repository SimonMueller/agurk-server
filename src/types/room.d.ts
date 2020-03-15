import {
  PlayerId, Error, ValidatedTurn, TurnError, Penalty, OutPlayer,
} from 'agurk-shared';

export interface RoomApi {
  readonly broadcastStartGame: (players: PlayerId[]) => void;
  readonly broadcastStartRound: (players: PlayerId[]) => void;
  readonly broadcastStartCycle: (orderedPlayers: PlayerId[]) => void;
  readonly broadcastStartPlayerTurn: (playerId: PlayerId) => void;
  readonly broadcastPlayerTurn: (turn: ValidatedTurn) => void;
  readonly broadcastEndCycle: (outPlayer: OutPlayer[], highestTurnPlayers: PlayerId[]) => void;
  readonly broadcastEndRound: (penalties: Penalty[], outPlayers: OutPlayer[], winner?: PlayerId) => void;
  readonly broadcastEndGame: (winner: PlayerId) => void;
  readonly broadcastGameError: (error: Error) => void;
  readonly broadcastPlayerTurnError: (error: TurnError) => void;
}
