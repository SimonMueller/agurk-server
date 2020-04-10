import {
  PlayerId, createJokerCard, createSuitCard, Colors, Suits,
} from 'agurk-shared';
import PlayerFactory from '../factories/player';
import createMockedRoomApi from '../mocks/roomApi';
import createMockedDealer from '../mocks/dealer';
import playRound from '../../src/game/round';
import createDealer from '../../src/game/dealer';

describe('play round', () => {
  test('first round of game with 2 players', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [
        createSuitCard(2, Suits.HEARTS),
        createSuitCard(3, Suits.HEARTS),
        createSuitCard(4, Suits.HEARTS),
        createSuitCard(5, Suits.HEARTS),
        createSuitCard(6, Suits.HEARTS),
        createSuitCard(7, Suits.HEARTS),
        createSuitCard(8, Suits.HEARTS),
      ],
      [player2.id]: [
        createSuitCard(2, Suits.DIAMONDS),
        createSuitCard(3, Suits.DIAMONDS),
        createSuitCard(4, Suits.DIAMONDS),
        createSuitCard(5, Suits.DIAMONDS),
        createSuitCard(6, Suits.DIAMONDS),
        createSuitCard(7, Suits.DIAMONDS),
        createSuitCard(8, Suits.DIAMONDS),
      ],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealer.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(2, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.HEARTS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(2, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(8, Suits.DIAMONDS)]);

    const round = await playRound(players, gameState.rounds, roomApi, dealer);

    expect(round).toMatchObject({
      initialHands,
      playerIds,
      winner: player1.id,
      penalties: [{
        playerId: player2.id,
        card: createSuitCard(8, Suits.DIAMONDS),
      }],
    });
  });

  test('multiple players with same highest card and latest is next cycle starting player', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const player3 = PlayerFactory.build();
    const players = [player1, player2, player3];
    const playerIds = [player1.id, player2.id, player3.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [
        createJokerCard(Colors.RED),
        createSuitCard(5, Suits.DIAMONDS),
      ],
      [player2.id]: [
        createSuitCard(8, Suits.SPADES),
        createSuitCard(12, Suits.DIAMONDS),
      ],
      [player3.id]: [
        createJokerCard(Colors.BLACK),
        createSuitCard(3, Suits.CLUBS),
      ],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealer.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      .mockResolvedValueOnce([createJokerCard(Colors.RED)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.DIAMONDS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(12, Suits.DIAMONDS)]);

    player3.api.requestCards
      .mockResolvedValueOnce([createJokerCard(Colors.BLACK)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.CLUBS)]);

    const { cycles } = await playRound(players, gameState.rounds, roomApi, dealer);
    const { playerIds: orderedSecondCyclePlayerIds } = cycles[1];

    expect(orderedSecondCyclePlayerIds[0]).toEqual(player3.id);
    expect(orderedSecondCyclePlayerIds[1]).toEqual(player1.id);
    expect(orderedSecondCyclePlayerIds[2]).toEqual(player2.id);
  });

  test('all players same card rank in last cycle of round. every player gets penalty and sample winner.', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const player3 = PlayerFactory.build();
    const players = [player1, player2, player3];
    const playerIds = [player1.id, player2.id, player3.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(5, Suits.DIAMONDS)],
      [player2.id]: [createSuitCard(5, Suits.SPADES)],
      [player3.id]: [createSuitCard(5, Suits.CLUBS)],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealer.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suits.DIAMONDS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suits.SPADES)]);

    player3.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suits.CLUBS)]);

    const round = await playRound(players, gameState.rounds, roomApi, dealer);

    expect(round.penalties).toEqual([
      {
        playerId: player1.id,
        card: createSuitCard(5, Suits.DIAMONDS),
      },
      {
        playerId: player2.id,
        card: createSuitCard(5, Suits.SPADES),
      },
      {
        playerId: player3.id,
        card: createSuitCard(5, Suits.CLUBS),
      }]);
    expect(round.winner).toEqual(player1.id);
  });

  test('bubbling up of cycle out players', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(8, Suits.CLUBS)],
      [player2.id]: [createSuitCard(9, Suits.HEARTS)],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealer.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suits.CLUBS)]);

    player2.api.requestCards
      .mockRejectedValue(new Error('some error happened'));

    const round = await playRound(players, gameState.rounds, roomApi, dealer);

    expect(round.outPlayers).toMatchObject([{
      id: player2.id,
    }]);
  });

  test('single player left in round. no penalty issued.', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(7, Suits.DIAMONDS)],
      [player2.id]: [createSuitCard(3, Suits.CLUBS)],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealer.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockRejectedValue(new Error('some error happened'));

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(3, Suits.CLUBS)]);

    const round = await playRound(players, gameState.rounds, roomApi, dealer);

    expect(round.penalties).toHaveLength(0);
    expect(round.winner).toEqual(player1.id);
  });

  test('no players left in round. no winner set and no penalties issued', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const gameState = {
      playerIds,
      rounds: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(7, Suits.DIAMONDS)],
      [player2.id]: [createSuitCard(3, Suits.CLUBS)],
    };
    const mockedDealer = createMockedDealer();
    const realDealer = createDealer();
    mockedDealer.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    mockedDealer.samplePlayerId.mockImplementation(realDealer.samplePlayerId);

    player1.api.requestCards
      .mockRejectedValue(new Error('some error happened'));

    player2.api.requestCards
      .mockRejectedValue(new Error('some error happened'));

    const round = await playRound(players, gameState.rounds, roomApi, mockedDealer);

    expect(round.penalties).toHaveLength(0);
    expect(round.winner).toBeUndefined();
  });
});
