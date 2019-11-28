import { samplePlayerId, createHandsForPlayerIds } from '../../src/game/dealer';
import PlayerIdFactory from '../factories/playerId';

describe('sample player id', () => {
  test('only one of given player ids', () => {
    const playerIds = PlayerIdFactory.buildList(3);

    expect(playerIds).toContain(samplePlayerId(playerIds));
  });

  test('empty array throws', () => {
    expect(() => samplePlayerId([])).toThrow('cannot sample player id');
  });

  test('array with one element results in first element', () => {
    const playerIds = PlayerIdFactory.buildList(1);

    expect(samplePlayerId(playerIds)).toEqual(playerIds[0]);
  });
});

describe('create player hands', () => {
  test('empty playerId and cards to omit in second round', () => {
    expect(createHandsForPlayerIds([], [], 2)).toEqual({});
  });

  test('hand for every player present', () => {
    const playerIds = PlayerIdFactory.buildList(5);

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

    const playerHands = createHandsForPlayerIds(playerIds, [], 2);

    expect(playerHands).not.toHaveProperty('somerandomplayerid');
  });
});
