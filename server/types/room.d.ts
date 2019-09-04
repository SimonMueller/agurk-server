import { OutPlayer, PlayerId } from '../../shared/types/player';
import { ValidatedTurn } from '../../shared/types/turn';
import { Penalty } from '../../shared/types/penalty';
import { SendableError } from '../../shared/types/communication';

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
  readonly broadcastGameError: (error: SendableError) => void;
  readonly broadcastPlayerTurnError: (error: SendableError) => void;
}
