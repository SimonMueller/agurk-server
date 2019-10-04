import {
  Card, JokerCard, SuitCard, SuitRank,
} from '../types/card';

export const enum CardKind {
  Joker = 'JOKER',
  Suit = 'SUIT',
}

export const enum Suit {
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
  DIAMONDS = 'DIAMONDS',
  HEARTS = 'HEARTS',
}

export const enum Color {
  RED = 'RED',
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}

export function equals(card1: Card, card2: Card): boolean {
  const rankEquals = card1.rank === card2.rank;

  if (card1.kind === CardKind.Suit && card2.kind === CardKind.Suit) {
    return rankEquals && card1.suit === card2.suit;
  }

  if (card1.kind === CardKind.Joker && card2.kind === CardKind.Joker) {
    return rankEquals && card1.color === card2.color;
  }

  return false;
}

export const compareRanks = (card1: Card, card2: Card): number => Math.sign(card1.rank - card2.rank);

export const createSuitCard = (rank: SuitRank, suit: Suit): SuitCard => ({ rank, suit, kind: CardKind.Suit });

export const createJokerCard = (color: Color): JokerCard => ({ rank: 15, color, kind: CardKind.Joker });
