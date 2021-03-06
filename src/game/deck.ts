import {
  JokerCard, JokerRank, SuitCard, SuitRank, Colors, createJokerCard, createSuitCard, Suits, Suit, Color,
} from 'agurk-shared';
import { Deck } from '../types/deck';

export const SUITS: Suit[] = [Suits.CLUBS, Suits.DIAMONDS, Suits.HEARTS, Suits.SPADES];

export const SUIT_RANKS: SuitRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const JOKER_COLORS: Color[] = [Colors.BLACK, Colors.RED, Colors.WHITE];

export const JOKER_RANK: JokerRank = 15;

function createJokerCards(): JokerCard[] {
  const jokerCount = JOKER_COLORS.length;
  return Array.from(new Array(jokerCount)).map((_, index) => (createJokerCard(JOKER_COLORS[index])));
}

function createSuitCards(): SuitCard[] {
  const deckSizeWithoutJokers = SUIT_RANKS.length * SUITS.length;
  return Array.from(new Array(deckSizeWithoutJokers)).map((_, index) => {
    const rank = SUIT_RANKS[index % SUIT_RANKS.length];
    const suit = SUITS[index % SUITS.length];
    return createSuitCard(rank, suit);
  });
}

export function create(): Deck {
  return [
    ...createSuitCards(),
    ...createJokerCards(),
  ];
}
