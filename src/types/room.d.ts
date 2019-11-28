import {
  OutPlayer, PlayerId, Error, Penalty, TurnError, ValidatedTurn,
} from 'agurk-shared';

export interface RoomApi {
  readonly broadcastStartGame: (arg: void) => void;
  readonly broadcastStartRound: (arg: void) => void;
  readonly broadcastStartCycle: (arg: void) => void;
  readonly broadcastStartPlayerTurn: (playerId: PlayerId) => void;
  readonly broadcastPlayerTurn: (turn: ValidatedTurn) => void;
  readonly broadcastEndCycle: (arg: void) => void;
  readonly broadcastEndRound: (arg: void) => void;
  readonly broadcastPlayers: (playerIds: PlayerId[]) => void;
  readonly broadcastGameWinner: (playerId: PlayerId) => void;
  readonly broadcastPlayerOrder: (playerIds: PlayerId[]) => void;
  readonly broadcastRoundWinner: (playerId: PlayerId) => void;
  readonly broadcastPenalties: (penalties: Penalty[]) => void;
  readonly broadcastOutPlayers: (outPlayers: OutPlayer[]) => void;
  readonly broadcastEndGame: (arg: void) => void;
  readonly broadcastGameError: (error: Error) => void;
  readonly broadcastPlayerTurnError: (error: TurnError) => void;
}
