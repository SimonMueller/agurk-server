import WebSocket from 'ws';
import {
  Error, MessageName, OutPlayer, Penalty, PlayerId, TurnError, ValidatedTurn,
} from 'agurk-shared';
import { partial } from 'ramda';
import { broadcast } from './clientCommunication';
import { RoomApi } from '../types/room';

function broadcastGameError(sockets: WebSocket[], error: Error): void {
  const message = {
    name: MessageName.BROADCAST_GAME_ERROR,
    data: error,
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartGame(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_START_GAME,
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartPlayerTurn(sockets: WebSocket[], playerId: PlayerId): void {
  const message = {
    name: MessageName.BROADCAST_START_PLAYER_TURN,
    data: playerId,
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndGame(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_END_GAME,
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndRound(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_END_ROUND,
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartRound(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_START_ROUND,
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndCycle(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_END_CYCLE,
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartCycle(sockets: WebSocket[]): void {
  const message = {
    name: MessageName.BROADCAST_START_CYCLE,
  } as const;
  return broadcast(sockets, message);
}

function broadcastPlayers(sockets: WebSocket[], players: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_PLAYERS,
    data: players,
  } as const;
  return broadcast(sockets, message);
}

function broadcastGameWinner(sockets: WebSocket[], winner: PlayerId): void {
  const message = {
    name: MessageName.BROADCAST_GAME_WINNER,
    data: winner,
  } as const;
  return broadcast(sockets, message);
}

function broadcastPlayerOrder(sockets: WebSocket[], playerOrder: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_PLAYER_ORDER,
    data: playerOrder,
  } as const;
  return broadcast(sockets, message);
}

function broadcastPlayerTurn(sockets: WebSocket[], turn: ValidatedTurn): void {
  const message = {
    name: MessageName.BROADCAST_PLAYER_TURN,
    data: turn,
  } as const;
  return broadcast(sockets, message);
}

function broadcastRoundWinner(sockets: WebSocket[], roundWinner: PlayerId): void {
  const message = {
    name: MessageName.BROADCAST_ROUND_WINNER,
    data: roundWinner,
  } as const;
  return broadcast(sockets, message);
}

function broadcastPenalties(sockets: WebSocket[], penalties: Penalty[]): void {
  const message = {
    name: MessageName.BROADCAST_PENALTIES,
    data: penalties,
  } as const;
  return broadcast(sockets, message);
}

function broadcastOutPlayers(sockets: WebSocket[], outPlayers: OutPlayer[]): void {
  const message = {
    name: MessageName.BROADCAST_OUT_PLAYERS,
    data: outPlayers,
  } as const;
  return broadcast(sockets, message);
}

function broadcastPlayerTurnError(sockets: WebSocket[], turnError: TurnError): void {
  const message = {
    name: MessageName.BROADCAST_PLAYER_TURN_ERROR,
    data: turnError,
  } as const;
  return broadcast(sockets, message);
}

export default function create(sockets: WebSocket[]): RoomApi {
  return {
    broadcastStartGame: partial(broadcastStartGame, [sockets]),
    broadcastStartRound: partial(broadcastStartRound, [sockets]),
    broadcastStartCycle: partial(broadcastStartCycle, [sockets]),
    broadcastStartPlayerTurn: partial(broadcastStartPlayerTurn, [sockets]),
    broadcastPlayerTurn: partial(broadcastPlayerTurn, [sockets]),
    broadcastEndCycle: partial(broadcastEndCycle, [sockets]),
    broadcastEndRound: partial(broadcastEndRound, [sockets]),
    broadcastPlayers: partial(broadcastPlayers, [sockets]),
    broadcastGameWinner: partial(broadcastGameWinner, [sockets]),
    broadcastPlayerOrder: partial(broadcastPlayerOrder, [sockets]),
    broadcastRoundWinner: partial(broadcastRoundWinner, [sockets]),
    broadcastPenalties: partial(broadcastPenalties, [sockets]),
    broadcastOutPlayers: partial(broadcastOutPlayers, [sockets]),
    broadcastEndGame: partial(broadcastEndGame, [sockets]),
    broadcastGameError: partial(broadcastGameError, [sockets]),
    broadcastPlayerTurnError: partial(broadcastPlayerTurnError, [sockets]),
  };
}
