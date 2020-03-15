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

  test('player hands not to have unknown playerId property', () => {
    const playerIds = PlayerIdFactory.buildList(2);
    const { createHandsForPlayerIds } = createDealer();

    const playerHands = createHandsForPlayerIds(playerIds, [], 2);

    expect(playerHands).not.toHaveProperty('somerandomplayerid');
  });
});
