import WebSocket from 'ws';
import {
  OutPlayer, PlayerId, Penalty, Error, TurnError, ValidatedTurn, messageTypes,
} from 'agurk-shared';
import { broadcast } from './clientCommunication';

export function broadcastGameError(sockets: WebSocket[], error: Error): void {
  return broadcast(sockets, messageTypes.BROADCAST_GAME_ERROR, error);
}

export function broadcastStartGame(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_START_GAME);
}

export function broadcastStartPlayerTurn(sockets: WebSocket[], playerId: PlayerId): void {
  return broadcast(sockets, messageTypes.BROADCAST_START_PLAYER_TURN, playerId);
}

export function broadcastEndGame(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_END_GAME);
}

export function broadcastEndRound(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_END_ROUND);
}

export function broadcastStartRound(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_START_ROUND);
}

export function broadcastEndCycle(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_END_CYCLE);
}

export function broadcastStartCycle(sockets: WebSocket[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_START_CYCLE);
}

export function broadcastPlayers(sockets: WebSocket[], players: PlayerId[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_PLAYERS, players);
}

export function broadcastGameWinner(sockets: WebSocket[], winner: PlayerId): void {
  return broadcast(sockets, messageTypes.BROADCAST_GAME_WINNER, winner);
}

export function broadcastPlayerOrder(sockets: WebSocket[], playerOrder: PlayerId[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_PLAYER_ORDER, playerOrder);
}

export function broadcastPlayerTurn(sockets: WebSocket[], turn: ValidatedTurn): void {
  return broadcast(sockets, messageTypes.BROADCAST_PLAYER_TURN, turn);
}

export function broadcastRoundWinner(sockets: WebSocket[], roundWinner: PlayerId): void {
  return broadcast(sockets, messageTypes.BROADCAST_ROUND_WINNER, roundWinner);
}

export function broadcastPenalties(sockets: WebSocket[], penalties: Penalty[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_PENALTIES, penalties);
}

export function broadcastOutPlayers(sockets: WebSocket[], outPlayers: OutPlayer[]): void {
  return broadcast(sockets, messageTypes.BROADCAST_OUT_PLAYERS, outPlayers);
}

export function broadcastPlayerTurnError(sockets: WebSocket[], turnError: TurnError): void {
  return broadcast(sockets, messageTypes.BROADCAST_PLAYER_TURN_ERROR, turnError);
}
