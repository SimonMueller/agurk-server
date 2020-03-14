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

function broadcastStartGame(sockets: WebSocket[], players: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_START_GAME,
    data: {
      players,
    },
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

function broadcastEndGame(sockets: WebSocket[], winner: PlayerId): void {
  const message = {
    name: MessageName.BROADCAST_END_GAME,
    data: {
      winner,
    },
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndRound(
  sockets: WebSocket[],
  penalties: Penalty[],
  outPlayers: OutPlayer[],
  winner: PlayerId,
): void {
  const message = {
    name: MessageName.BROADCAST_END_ROUND,
    data: {
      penalties,
      outPlayers,
      winner,
    },
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartRound(sockets: WebSocket[], players: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_START_ROUND,
    data: {
      players,
    },
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndCycle(sockets: WebSocket[], outPlayers: OutPlayer[], highestTurnPlayers: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_END_CYCLE,
    data: {
      outPlayers,
      highestTurnPlayers,
    },
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartCycle(sockets: WebSocket[], orderedPlayers: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_START_CYCLE,
    data: {
      orderedPlayers,
    },
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
    broadcastEndGame: partial(broadcastEndGame, [sockets]),
    broadcastGameError: partial(broadcastGameError, [sockets]),
    broadcastPlayerTurnError: partial(broadcastPlayerTurnError, [sockets]),
  };
}
