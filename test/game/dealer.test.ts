import { createSuitCard, Suits } from 'agurk-shared';
import createDealer from '../../src/game/dealer';
import PlayerIdFactory from '../factories/playerId';

describe('sample player id', () => {
  test('only one of given player ids', () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const { samplePlayerId } = createDealer();

    expect(playerIds).toContain(samplePlayerId(playerIds));
  });

  test('empty array results in undefined', () => {
    const dealer = createDealer();

    expect(dealer.samplePlayerId([])).toBeUndefined();
  });

  test('array with one element results in first element', () => {
    const playerIds = PlayerIdFactory.buildList(1);
    const { samplePlayerId } = createDealer();

    expect(samplePlayerId(playerIds)).toEqual(playerIds[0]);
  });
});

describe('create player hands', () => {
  test('empty playerId and cards to omit in second round', () => {
    const { createHandsForPlayerIds } = createDealer();

    expect(createHandsForPlayerIds([], [], 2)).toEqual({});
  });

  test('hand for every player present', () => {
    const playerIds = PlayerIdFactory.buildList(5);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [], 2);

    expect(Object.keys(playerHands)).toHaveLength(5);
    expect(playerHands).toHaveProperty(playerIds[0]);
    expect(playerHands).toHaveProperty(playerIds[1]);
    expect(playerHands).toHaveProperty(playerIds[2]);
    expect(playerHands).toHaveProperty(playerIds[3]);
    expect(playerHands).toHaveProperty(playerIds[4]);
  });

  test('each player hand has the same amount of cards', () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [], 7);

    expect(playerHands[playerIds[0]]).toHaveLength(7);
    expect(playerHands[playerIds[1]]).toHaveLength(7);
    expect(playerHands[playerIds[2]]).toHaveLength(7);
  });

  test('player hands not to have unknown playerId property', () => {
    const playerIds = PlayerIdFactory.buildList(2);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [], 2);

    expect(playerHands).not.toHaveProperty('somerandomplayerid');
  });

  test(`if the amount of cards to be dealt is not available from the deck because
    of too many penalty cards the amount of cards to be dealt is decreased once
    so that every  player can get the same amount of cards.`, () => {
    const playerIds = PlayerIdFactory.buildList(7);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [
      createSuitCard(4, Suits.CLUBS),
      createSuitCard(5, Suits.SPADES),
      createSuitCard(6, Suits.CLUBS),
      createSuitCard(7, Suits.DIAMONDS),
      createSuitCard(8, Suits.HEARTS),
      createSuitCard(9, Suits.SPADES),
      createSuitCard(10, Suits.SPADES),
    ], 7);

    expect(playerHands[playerIds[0]]).toHaveLength(6);
    expect(playerHands[playerIds[1]]).toHaveLength(6);
    expect(playerHands[playerIds[2]]).toHaveLength(6);
    expect(playerHands[playerIds[3]]).toHaveLength(6);
    expect(playerHands[playerIds[4]]).toHaveLength(6);
    expect(playerHands[playerIds[5]]).toHaveLength(6);
    expect(playerHands[playerIds[6]]).toHaveLength(6);
  });

  test(`if the amount of cards to be dealt is not available from the deck because
    of too many penalty cards the amount of cards to be dealt is decreased
    multiple times until every player can get the same amount of cards.`, () => {
    const playerIds = PlayerIdFactory.buildList(7);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [
      createSuitCard(4, Suits.CLUBS),
      createSuitCard(5, Suits.CLUBS),
      createSuitCard(6, Suits.CLUBS),
      createSuitCard(7, Suits.CLUBS),
      createSuitCard(8, Suits.CLUBS),
      createSuitCard(9, Suits.CLUBS),
      createSuitCard(10, Suits.CLUBS),
      createSuitCard(4, Suits.SPADES),
      createSuitCard(5, Suits.SPADES),
      createSuitCard(6, Suits.SPADES),
      createSuitCard(7, Suits.SPADES),
      createSuitCard(8, Suits.SPADES),
      createSuitCard(9, Suits.SPADES),
      createSuitCard(10, Suits.SPADES),
    ], 7);

    expect(playerHands[playerIds[0]]).toHaveLength(5);
    expect(playerHands[playerIds[1]]).toHaveLength(5);
    expect(playerHands[playerIds[2]]).toHaveLength(5);
    expect(playerHands[playerIds[3]]).toHaveLength(5);
    expect(playerHands[playerIds[4]]).toHaveLength(5);
    expect(playerHands[playerIds[5]]).toHaveLength(5);
    expect(playerHands[playerIds[6]]).toHaveLength(5);
  });
});
