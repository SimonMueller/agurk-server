export type Color = 'RED' | 'BLACK' | 'WHITE';

export type Suit = 'SPADES' | 'CLUBS' | 'DIAMONDS' | 'HEARTS';

export type SuitRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type JokerRank = 15;

export type Rank = SuitRank | JokerRank;

export interface SuitCard {
  readonly kind: 'SUIT';
  readonly rank: SuitRank;
  readonly suit: Suit;
}

export interface JokerCard {
  readonly kind: 'JOKER';
  readonly rank: JokerRank;
  readonly color: Color;
}

export type Card = JokerCard | SuitCard;
