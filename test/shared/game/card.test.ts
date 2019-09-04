import {
  compareRanks as compareCardRanks, createJokerCard, createSuitCard, equals as cardEquals, Color, Suit,
} from '../../../shared/game/card';
import { Card } from '../../../shared/types/card';

describe('card equals', () => {
  test('same suit and rank', () => {
    const card1: Card = createSuitCard(7, Suit.SPADES);
    const card2: Card = createSuitCard(7, Suit.SPADES);

    expect(cardEquals(card1, card2)).toBe(true);
  });

  test('different suit and rank', () => {
    const card1: Card = createJokerCard(Color.BLACK);
    const card2: Card = createSuitCard(7, Suit.HEARTS);

    expect(cardEquals(card1, card2)).toBe(false);
  });

  test('same suit but different rank', () => {
    const card1: Card = createSuitCard(7, Suit.SPADES);
    const card2: Card = createSuitCard(14, Suit.SPADES);

    expect(cardEquals(card1, card2)).toBe(false);
  });

  test('same rank but different suit', () => {
    const card1: Card = createSuitCard(7, Suit.SPADES);
    const card2: Card = createSuitCard(7, Suit.DIAMONDS);

    expect(cardEquals(card1, card2)).toBe(false);
  });

  test('same joker', () => {
    const card1: Card = createJokerCard(Color.BLACK);
    const card2: Card = createJokerCard(Color.BLACK);

    expect(cardEquals(card1, card2)).toBe(true);
  });

  test('different joker', () => {
    const card1: Card = createJokerCard(Color.BLACK);
    const card2: Card = createJokerCard(Color.RED);

    expect(cardEquals(card1, card2)).toBe(false);
  });
});

describe('compare card rank (ignore suit or color)', () => {
  test('lower rank different suit', () => {
    const card1: Card = createSuitCard(7, Suit.DIAMONDS);
    const card2: Card = createSuitCard(11, Suit.CLUBS);

    expect(compareCardRanks(card1, card2)).toBeLessThan(0);
  });

  test('higer rank different suit', () => {
    const card1: Card = createSuitCard(14, Suit.HEARTS);
    const card2: Card = createSuitCard(3, Suit.SPADES);

    expect(compareCardRanks(card1, card2)).toBeGreaterThan(0);
  });

  test('same rank different color', () => {
    const card1: Card = createJokerCard(Color.RED);
    const card2: Card = createJokerCard(Color.BLACK);

    expect(compareCardRanks(card1, card2)).toEqual(0);
  });

  test('lower rank than joker', () => {
    const card1: Card = createSuitCard(2, Suit.HEARTS);
    const card2: Card = createJokerCard(Color.BLACK);

    expect(compareCardRanks(card1, card2)).toBeLessThan(0);
  });

  test('same rank different suit', () => {
    const card1: Card = createSuitCard(6, Suit.CLUBS);
    const card2: Card = createSuitCard(6, Suit.CLUBS);

    expect(compareCardRanks(card1, card2)).toEqual(0);
  });
});
