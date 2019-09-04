import {
  any, array, number, string, object,
} from '@hapi/joi';
import { MessageType } from '../types/messageType';
import { CardKind, Color, Suit } from '../game/card';

export const BROADCAST_PLAYERS: MessageType = {
  name: 'BROADCAST_PLAYERS',
  validationSchema: any().forbidden(),
};

export const START_GAME: MessageType = {
  name: 'START_GAME',
  validationSchema: any().forbidden(),
};

export const BROADCAST_START_GAME: MessageType = {
  name: 'BROADCAST_START_GAME',
  validationSchema: any().forbidden(),
};

export const DEAL_CARDS: MessageType = {
  name: 'DEAL_CARDS',
  validationSchema: any().forbidden(),
};

export const BROADCAST_PLAYER_ORDER: MessageType = {
  name: 'BROADCAST_PLAYER_ORDER',
  validationSchema: any().forbidden(),
};

export const REQUEST_CARDS: MessageType = {
  name: 'REQUEST_CARDS',
  validationSchema: any().forbidden(),
};

export const PLAYED_CARDS: MessageType = {
  name: 'PLAYED_CARDS',
  validationSchema: array().items(object().keys({
    rank: number().valid([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).required(),
    suit: string().valid(Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS, Suit.SPADES),
    color: string().valid(Color.BLACK, Color.RED, Color.WHITE),
    kind: string().valid(CardKind.Suit, CardKind.Joker).required(),
  }).xor('suit', 'color')).min(1).max(7),
};

export const BROADCAST_PLAYER_TURN: MessageType = {
  name: 'BROADCAST_PLAYER_TURN',
  validationSchema: any().forbidden(),
};

export const BROADCAST_PLAYER_TURN_ERROR: MessageType = {
  name: 'BROADCAST_PLAYER_TURN_ERROR',
  validationSchema: any().forbidden(),
};

export const BROADCAST_ROUND_WINNER: MessageType = {
  name: 'BROADCAST_ROUND_WINNER',
  validationSchema: any().forbidden(),
};

export const BROADCAST_PENALTIES: MessageType = {
  name: 'BROADCAST_PENALTIES',
  validationSchema: any().forbidden(),
};

export const BROADCAST_OUT_PLAYERS: MessageType = {
  name: 'BROADCAST_OUT_PLAYERS',
  validationSchema: any().forbidden(),
};

export const BROADCAST_GAME_WINNER: MessageType = {
  name: 'BROADCAST_GAME_WINNER',
  validationSchema: any().forbidden(),
};

export const BROADCAST_START_ROUND: MessageType = {
  name: 'BROADCAST_START_ROUND',
  validationSchema: any().forbidden(),
};

export const BROADCAST_END_ROUND: MessageType = {
  name: 'BROADCAST_END_ROUND',
  validationSchema: any().forbidden(),
};

export const BROADCAST_START_CYCLE: MessageType = {
  name: 'BROADCAST_START_CYCLE',
  validationSchema: any().forbidden(),
};

export const BROADCAST_START_PLAYER_TURN: MessageType = {
  name: 'BROADCAST_START_PLAYER_TURN',
  validationSchema: any().forbidden(),
};

export const BROADCAST_END_CYCLE: MessageType = {
  name: 'BROADCAST_END_CYCLE',
  validationSchema: any().forbidden(),
};

export const BROADCAST_END_GAME: MessageType = {
  name: 'BROADCAST_END_GAME',
  validationSchema: any().forbidden(),
};

export const ERROR: MessageType = {
  name: 'ERROR',
  validationSchema: any().forbidden(),
};

export const BROADCAST_GAME_ERROR: MessageType = {
  name: 'BROADCAST_GAME_ERROR',
  validationSchema: any().forbidden(),
};
