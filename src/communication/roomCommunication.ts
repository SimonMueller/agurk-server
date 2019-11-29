import WebSocket from 'ws';
import {
  Error, MessageName, OutPlayer, Penalty, PlayerId, TurnError, ValidatedTurn,
} from 'agurk-shared';
import { any } from '@hapi/joi';
import { broadcast } from './clientCommunication';

export function broadcastGameError(sockets: WebSocket[], error: Error): void {
  const messageType = {
    name: MessageName.BROADCAST_GAME_ERROR,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, error);
}

export function broadcastStartGame(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.START_GAME,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastStartPlayerTurn(sockets: WebSocket[], playerId: PlayerId): void {
  const messageType = {
    name: MessageName.BROADCAST_START_PLAYER_TURN,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, playerId);
}

export function broadcastEndGame(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.BROADCAST_END_GAME,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastEndRound(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.BROADCAST_END_ROUND,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastStartRound(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.BROADCAST_START_ROUND,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastEndCycle(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.BROADCAST_END_CYCLE,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastStartCycle(sockets: WebSocket[]): void {
  const messageType = {
    name: MessageName.BROADCAST_START_CYCLE,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType);
}

export function broadcastPlayers(sockets: WebSocket[], players: PlayerId[]): void {
  const messageType = {
    name: MessageName.BROADCAST_PLAYERS,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, players);
}

export function broadcastGameWinner(sockets: WebSocket[], winner: PlayerId): void {
  const messageType = {
    name: MessageName.BROADCAST_GAME_WINNER,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, winner);
}

export function broadcastPlayerOrder(sockets: WebSocket[], playerOrder: PlayerId[]): void {
  const messageType = {
    name: MessageName.BROADCAST_PLAYER_ORDER,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, playerOrder);
}

export function broadcastPlayerTurn(sockets: WebSocket[], turn: ValidatedTurn): void {
  const messageType = {
    name: MessageName.BROADCAST_PLAYER_TURN,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, turn);
}

export function broadcastRoundWinner(sockets: WebSocket[], roundWinner: PlayerId): void {
  const messageType = {
    name: MessageName.BROADCAST_ROUND_WINNER,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, roundWinner);
}

export function broadcastPenalties(sockets: WebSocket[], penalties: Penalty[]): void {
  const messageType = {
    name: MessageName.BROADCAST_PENALTIES,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, penalties);
}

export function broadcastOutPlayers(sockets: WebSocket[], outPlayers: OutPlayer[]): void {
  const messageType = {
    name: MessageName.BROADCAST_OUT_PLAYERS,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, outPlayers);
}

export function broadcastPlayerTurnError(sockets: WebSocket[], turnError: TurnError): void {
  const messageType = {
    name: MessageName.BROADCAST_PLAYER_TURN_ERROR,
    validationSchema: any().forbidden(),
  };
  return broadcast(sockets, messageType, turnError);
}
