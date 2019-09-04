import config from 'config';
import WebSocket from 'ws';
import { Card } from '../../shared/types/card';
import { GameResult } from '../types/game';
import { request, unicast, on } from './clientCommunication';
import * as messageTypes from '../../shared/communication/messageTypes';
import { SendableError } from '../../shared/types/communication';

const requestTimeoutInMillis: number = config.get('server.requestTimeoutInMillis');

export function onStartGame(
  socket: WebSocket,
  handler: () => Promise<GameResult>,
): Promise<GameResult> {
  return on(socket, messageTypes.START_GAME, handler);
}

export function dealCards(
  socket: WebSocket,
  cards: Card[],
): void {
  return unicast(socket, messageTypes.DEAL_CARDS, cards);
}

export function requestCards(socket: WebSocket): Promise<Card[]> {
  return request<Card[]>(socket, messageTypes.REQUEST_CARDS, messageTypes.PLAYED_CARDS, requestTimeoutInMillis);
}

export function sendError(
  socket: WebSocket,
  error: SendableError,
): void {
  return unicast(socket, messageTypes.ERROR, error);
}
