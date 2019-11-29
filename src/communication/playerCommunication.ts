import config from 'config';
import WebSocket from 'ws';
import {
  any, array, number, object, string,
} from '@hapi/joi';
import {
  Card, CardKind, Colors, Error, MessageName, Suits,
} from 'agurk-shared';
import { GameResult } from '../types/game';
import { on, request, unicast } from './clientCommunication';

const requestTimeoutInMillis: number = config.get('server.requestTimeoutInMillis');

export function onStartGame(socket: WebSocket, handler: () => Promise<GameResult>): Promise<GameResult> {
  const messageType = {
    name: MessageName.START_GAME,
    validationSchema: any().forbidden(),
  };
  return on(socket, messageType, handler);
}

export function dealCards(socket: WebSocket, cards: Card[]): void {
  const messageType = {
    name: MessageName.DEAL_CARDS,
    validationSchema: any().forbidden(),
  };
  return unicast(socket, messageType, cards);
}

export function requestCards(socket: WebSocket): Promise<Card[]> {
  const requesterMessageType = {
    name: MessageName.REQUEST_CARDS,
    validationSchema: any().forbidden(),
  };
  const expectedMessageType = {
    name: MessageName.PLAYED_CARDS,
    validationSchema: array().items(object().keys({
      rank: number().valid([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).required(),
      suit: string().valid(Suits.HEARTS, Suits.CLUBS, Suits.DIAMONDS, Suits.SPADES),
      color: string().valid(Colors.BLACK, Colors.RED, Colors.WHITE),
      kind: string().valid(CardKind.Suit, CardKind.Joker).required(),
    }).xor('suit', 'color')).min(1).max(7),
  };
  return request<Card[]>(socket, requesterMessageType, expectedMessageType, requestTimeoutInMillis);
}

export function sendError(socket: WebSocket, error: Error): void {
  const messageType = {
    name: MessageName.ERROR,
    validationSchema: any().forbidden(),
  };
  return unicast(socket, messageType, error);
}
