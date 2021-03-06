import config from 'config';
import WebSocket from 'ws';
import {
  any, array, number, object, string,
} from 'joi';
import {
  Card, JOKER_CARD_KIND, SUIT_CARD_KIND, Colors, MessageName, Suits,
} from 'agurk-shared';
import { partial } from 'ramda';
import { Observable } from 'rxjs';
import { on, request, unicast } from './clientCommunication';
import { ExpectedMessage } from '../types/messageType';
import { PlayerApi } from '../types/player';

const REQUEST_TIMEOUT_IN_MILLIS: number = config.get('server.requestTimeoutInMillis');

function onStartGame(socket: WebSocket): Observable<void> {
  const message = {
    name: MessageName.START_GAME,
    dataValidationSchema: any().forbidden(),
  } as const;
  return on(socket, message);
}

function dealCards(socket: WebSocket, cards: Card[]): void {
  const message = {
    name: MessageName.AVAILABLE_CARDS_IN_HAND,
    data: cards,
  } as const;
  return unicast(socket, message);
}

function requestCards(socket: WebSocket, retriesLeft: number): Promise<Card[]> {
  const requesterMessage = {
    name: MessageName.REQUEST_CARDS,
    data: {
      timeoutInMillis: REQUEST_TIMEOUT_IN_MILLIS,
      retriesLeft,
    },
  } as const;
  const expectedMessage: ExpectedMessage = {
    name: MessageName.PLAY_CARDS,
    dataValidationSchema: array().items(object().keys({
      rank: number().valid(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15).required(),
      suit: string().valid(Suits.HEARTS, Suits.CLUBS, Suits.DIAMONDS, Suits.SPADES),
      color: string().valid(Colors.BLACK, Colors.RED, Colors.WHITE),
      kind: string().valid(SUIT_CARD_KIND, JOKER_CARD_KIND).required(),
    }).xor('suit', 'color')).min(1).max(7),
  };
  return request<Card[]>(socket, requesterMessage, expectedMessage, REQUEST_TIMEOUT_IN_MILLIS);
}

function availableCardsInHand(socket: WebSocket, cards: Card[]): void {
  const message = {
    name: MessageName.AVAILABLE_CARDS_IN_HAND,
    data: cards,
  } as const;
  return unicast(socket, message);
}

export default function create(socket: WebSocket): PlayerApi {
  return {
    onStartGame: partial(onStartGame, [socket]),
    isConnected: (): boolean => socket.readyState === WebSocket.OPEN,
    dealCards: partial(dealCards, [socket]),
    requestCards: partial(requestCards, [socket]),
    sendAvailableCardsInHand: partial(availableCardsInHand, [socket]),
  };
}
