import WebSocket from 'ws';
import {
  MessageName, OutPlayer, Penalty, PlayerId, ValidatedTurn,
} from 'agurk-shared';
import { partial } from 'ramda';
import { broadcast } from './clientCommunication';
import { RoomApi } from '../types/room';

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

function broadcastSuccessEndGame(sockets: WebSocket[], winner: PlayerId): void {
  const message = {
    name: MessageName.BROADCAST_END_GAME,
    data: { isValid: true, winner },
  } as const;
  return broadcast(sockets, message);
}

function broadcastOutPlayerAfterTurn(sockets: WebSocket[], outPlayer: OutPlayer): void {
  const message = {
    name: MessageName.BROADCAST_OUT_PLAYER_AFTER_TURN,
    data: outPlayer,
  } as const;
  return broadcast(sockets, message);
}

function broadcastErrorEndGame(sockets: WebSocket[], errorMessage: string): void {
  const message = {
    name: MessageName.BROADCAST_END_GAME,
    data: { isValid: false, errorMessage },
  } as const;
  return broadcast(sockets, message);
}

function broadcastEndRound(
  sockets: WebSocket[],
  penalties: Penalty[],
  outPlayers: OutPlayer[],
  winner: PlayerId | undefined,
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

function broadcastEndCycle(
  sockets: WebSocket[],
  outPlayers: OutPlayer[],
  highestTurnPlayers: PlayerId[],
  delayAfterEndInMillis: number,
): void {
  const message = {
    name: MessageName.BROADCAST_END_CYCLE,
    data: {
      outPlayers,
      highestTurnPlayers,
      delayAfterEndInMillis,
    },
  } as const;
  return broadcast(sockets, message);
}

function broadcastStartCycle(sockets: WebSocket[], orderedPlayers: PlayerId[], isLastOfRound: boolean): void {
  const message = {
    name: MessageName.BROADCAST_START_CYCLE,
    data: {
      orderedPlayers,
      isLastOfRound,
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

function broadcastLobbyPlayers(sockets: WebSocket[], players: PlayerId[]): void {
  const message = {
    name: MessageName.BROADCAST_LOBBY_PLAYERS,
    data: players,
  } as const;
  return broadcast(sockets, message);
}

export default function create(sockets: WebSocket[]): RoomApi {
  return {
    broadcastStartGame: partial(broadcastStartGame, [sockets]),
    broadcastStartRound: partial(broadcastStartRound, [sockets]),
    broadcastStartCycle: partial(broadcastStartCycle, [sockets]),
    broadcastStartPlayerTurn: partial(broadcastStartPlayerTurn, [sockets]),
    broadcastOutPlayerAfterTurn: partial(broadcastOutPlayerAfterTurn, [sockets]),
    broadcastPlayerTurn: partial(broadcastPlayerTurn, [sockets]),
    broadcastEndCycle: partial(broadcastEndCycle, [sockets]),
    broadcastEndRound: partial(broadcastEndRound, [sockets]),
    broadcastErrorEndGame: partial(broadcastErrorEndGame, [sockets]),
    broadcastSuccessEndGame: partial(broadcastSuccessEndGame, [sockets]),
    broadcastLobbyPlayers: partial(broadcastLobbyPlayers, [sockets]),
  };
}
