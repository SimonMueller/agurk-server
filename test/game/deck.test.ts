import {
  createJokerCard, createSuitCard, Colors, Suits,
} from 'agurk-shared';
import {
  create as createDeck, JOKER_COLORS, JOKER_RANK, SUIT_RANKS, SUITS,
} from '../../src/game/deck';

describe('suits, ranks and jokers', () => {
  test('correct suits length', () => {
    expect(SUITS).toHaveLength(4);
  });

  test('correct joker colors length', () => {
    expect(JOKER_COLORS).toHaveLength(3);
  });

  test('joker colors only consist of valid colors', () => {
    expect(JOKER_COLORS).toContain(Colors.RED);
    expect(JOKER_COLORS).toContain(Colors.BLACK);
    expect(JOKER_COLORS).toContain(Colors.WHITE);
  });

  test('correct joker rank', () => {
    expect(JOKER_RANK).toBe(15);
  });

  test('suits only consist of valid suits', () => {
    expect(SUITS).toContain(Suits.DIAMONDS);
    expect(SUITS).toContain(Suits.HEARTS);
    expect(SUITS).toContain(Suits.SPADES);
    expect(SUITS).toContain(Suits.CLUBS);
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

    expect(deck).toContainEqual(createSuitCard(2, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(3, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(4, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(5, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(6, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(7, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(8, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(9, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(10, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(11, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(12, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(13, Suits.HEARTS));
    expect(deck).toContainEqual(createSuitCard(14, Suits.HEARTS));
  });

  test('contains every card of spades', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(3, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(4, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(5, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(6, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(7, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(8, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(9, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(10, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(11, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(12, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(13, Suits.SPADES));
    expect(deck).toContainEqual(createSuitCard(14, Suits.SPADES));
  });

  test('contains every card of clubs', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(3, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(4, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(5, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(6, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(7, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(8, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(9, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(10, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(11, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(12, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(13, Suits.CLUBS));
    expect(deck).toContainEqual(createSuitCard(14, Suits.CLUBS));
  });

  test('contains every card of diamonds', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createSuitCard(2, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(3, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(4, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(5, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(6, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(7, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(8, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(9, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(10, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(11, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(12, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(13, Suits.DIAMONDS));
    expect(deck).toContainEqual(createSuitCard(14, Suits.DIAMONDS));
  });

  test('contains every joker card', () => {
    const deck = createDeck();

    expect(deck).toContainEqual(createJokerCard(Colors.BLACK));
    expect(deck).toContainEqual(createJokerCard(Colors.WHITE));
    expect(deck).toContainEqual(createJokerCard(Colors.RED));
  });
});
