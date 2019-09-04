import {
  create as createDeck, JOKER_COLORS, JOKER_RANK, SUIT_RANKS, SUITS,
} from '../../../server/game/deck';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';

describe('suits, ranks and jokers', () => {
  test('correct suits length', () => {
    expect(SUITS).toHaveLength(4);
  });

  test('correct joker colors length', () => {
    expect(JOKER_COLORS).toHaveLength(3);
  });

  test('joker colors only consist of valid colors', () => {
    expect(JOKER_COLORS).toContain(Color.RED);
    expect(JOKER_COLORS).toContain(Color.BLACK);
    expect(JOKER_COLORS).toContain(Color.WHITE);
  });

  test('correct joker rank', () => {
    expect(JOKER_RANK).toBe(15);
  });

  test('suits only consist of valid suits', () => {
    expect(SUITS).toContain(Suit.DIAMONDS);
    expect(SUITS).toContain(Suit.HEARTS);
    expect(SUITS).toContain(Suit.SPADES);
    expect(SUITS).toContain(Suit.CLUBS);
  });

  test('correct ranks length', () => {
    expect(SUIT_RANKS).toHaveLength(13);
  });

  test('ranks only consist of valid ranks', () => {
    expect(SUIT_RANKS).toContain(2);
    expect(SUIT_RANKS).toContain(3);
    expect(SUIT_RANKS).toContain(4);
    expect(SUIT_RANKS).toContain(5);
    expect(SUIT_RANKS).toContain(6);
    expect(SUIT_RANKS).toContain(7);
    expect(SUIT_RANKS).toContain(8);
    expect(SUIT_RANKS).toContain(9);
    expect(SUIT_RANKS).toContain(10);
    expect(SUIT_RANKS).toContain(11);
    expect(SUIT_RANKS).toContain(12);
    expect(SUIT_RANKS).toContain(13);
    expect(SUIT_RANKS).toContain(14);
  });
});

describe('create deck', () => {
  test('has correct lenght', () => {
    const deck = createDeck();

    expect(deck).toHaveLength(55);
  });

  test('contains every card of hearts', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(3, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(4, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(5, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(6, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(7, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(8, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(9, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(10, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(11, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(12, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(13, Suit.HEARTS));
    expect(deck).toContainEqual(createSuitCard(14, Suit.HEARTS));
  });

  test('contains every card of spades', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(3, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(4, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(5, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(6, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(7, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(8, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(9, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(10, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(11, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(12, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(13, Suit.SPADES));
    expect(deck).toContainEqual(createSuitCard(14, Suit.SPADES));
  });

  test('contains every card of clubs', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(3, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(4, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(5, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(6, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(7, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(8, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(9, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(10, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(11, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(12, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(13, Suit.CLUBS));
    expect(deck).toContainEqual(createSuitCard(14, Suit.CLUBS));
  });

  test('contains every card of diamonds', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(3, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(4, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(5, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(6, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(7, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(8, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(9, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(10, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(11, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(12, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(13, Suit.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(14, Suit.DIAMONDS));
  });

  test('contains every joker card', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createJokerCard(Color.BLACK));
    expect(deck).toContainEqual(createJokerCard(Color.WHITE));
    expect(deck).toContainEqual(createJokerCard(Color.RED));
  });
});
