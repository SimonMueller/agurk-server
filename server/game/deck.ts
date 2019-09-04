import { Deck } from '../types/deck';
import {
  Color, createJokerCard, createSuitCard, Suit,
} from '../../shared/game/card';
import {
  JokerCard, JokerRank, SuitCard, SuitRank,
} from '../../shared/types/card';

export const SUITS: Suit[] = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];

export const SUIT_RANKS: SuitRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const JOKER_COLORS: Color[] = [Color.BLACK, Color.RED, Color.WHITE];

export const JOKER_RANK: JokerRank = 15;

const createJokerCards = (): JokerCard[] => {
  const jokerCount = JOKER_COLORS.length;
  return Array.from(new Array(jokerCount)).map((_, index) => (createJokerCard(JOKER_COLORS[index])));
};

const createSuitCards = (): SuitCard[] => {
  const deckSizeWithoutJokers = SUIT_RANKS.length * SUITS.length;
  return Array.from(new Array(deckSizeWithoutJokers)).map((_, index) => {
    const rank = SUIT_RANKS[index % SUIT_RANKS.length];
    const suit = SUITS[index % SUITS.length];
    return createSuitCard(rank, suit);
  });
};

export const create = (): Deck => [
  ...createSuitCards(),
  ...createJokerCards(),
];
