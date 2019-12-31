import config from 'config';
import WebSocket from 'ws';
import {
  any, array, number, object, string,
} from '@hapi/joi';
import {
  Card, CardKind, Colors, MessageName, Suits,
} from 'agurk-shared';
import { GameResult } from '../types/game';
import { on, request, unicast } from './clientCommunication';
import { ExpectedMessage } from '../types/messageType';

const requestTimeoutInMillis: number = config.get('server.requestTimeoutInMillis');

export function onStartGame(socket: WebSocket, handler: () => Promise<GameResult>): Promise<GameResult> {
  const message = {
    name: MessageName.START_GAME,
    dataValidationSchema: any().forbidden(),
  } as const;
  return on(socket, message, handler);
}

export function dealCards(socket: WebSocket, cards: Card[]): void {
  const message = {
    name: MessageName.DEALT_CARDS,
    data: cards,
  } as const;
  return unicast(socket, message);
}

export function requestCards(socket: WebSocket): Promise<Card[]> {
  const requesterMessage = {
    name: MessageName.REQUEST_CARDS,
  } as const;
  const expectedMessage: ExpectedMessage = {
    name: MessageName.PLAY_CARDS,
    dataValidationSchema: array().items(object().keys({
      rank: number().valid([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).required(),
      suit: string().valid(Suits.HEARTS, Suits.CLUBS, Suits.DIAMONDS, Suits.SPADES),
      color: string().valid(Colors.BLACK, Colors.RED, Colors.WHITE),
      kind: string().valid(CardKind.Suit, CardKind.Joker).required(),
    }).xor('suit', 'color')).min(1).max(7),
  };
  return request<Card[]>(socket, requesterMessage, expectedMessage, requestTimeoutInMillis);
}
