import PlayerFactory from '../../factories/player';
import createMockedRoomApi from '../../mocks/roomApi';
import createMockedDealerApi from '../../mocks/dealerApi';
import playRound from '../../../server/game/round';
import { PlayerId } from '../../../shared/types/player';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';

describe('play round', () => {
  test('first round of game with 2 players', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const gameState = {
      playerIds,
      rounds: [],
      outPlayers: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [
        createSuitCard(2, Suit.HEARTS),
        createSuitCard(3, Suit.HEARTS),
        createSuitCard(4, Suit.HEARTS),
        createSuitCard(5, Suit.HEARTS),
        createSuitCard(6, Suit.HEARTS),
        createSuitCard(7, Suit.HEARTS),
        createSuitCard(8, Suit.HEARTS),
      ],
      [player2.id]: [
        createSuitCard(2, Suit.DIAMONDS),
        createSuitCard(3, Suit.DIAMONDS),
        createSuitCard(4, Suit.DIAMONDS),
        createSuitCard(5, Suit.DIAMONDS),
        createSuitCard(6, Suit.DIAMONDS),
        createSuitCard(7, Suit.DIAMONDS),
        createSuitCard(8, Suit.DIAMONDS),
      ],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealerApi.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(2, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.HEARTS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(2, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(8, Suit.DIAMONDS)]);

    const round = await playRound(players, gameState, roomApi, dealerApi);

    expect(round).toMatchObject({
      initialHands,
      playerIds,
      winner: player1.id,
      penalties: [{
        playerId: player2.id,
        card: createSuitCard(8, Suit.DIAMONDS),
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
      outPlayers: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [
        createJokerCard(Color.RED),
        createSuitCard(5, Suit.DIAMONDS),
      ],
      [player2.id]: [
        createSuitCard(8, Suit.SPADES),
        createSuitCard(12, Suit.DIAMONDS),
      ],
      [player3.id]: [
        createJokerCard(Color.BLACK),
        createSuitCard(3, Suit.CLUBS),
      ],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealerApi.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      .mockResolvedValueOnce([createJokerCard(Color.RED)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.DIAMONDS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(12, Suit.DIAMONDS)]);

    player3.api.requestCards
      .mockResolvedValueOnce([createJokerCard(Color.BLACK)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.CLUBS)]);

    const { cycles } = await playRound(players, gameState, roomApi, dealerApi);
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
      outPlayers: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(5, Suit.DIAMONDS)],
      [player2.id]: [createSuitCard(5, Suit.SPADES)],
      [player3.id]: [createSuitCard(5, Suit.CLUBS)],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealerApi.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suit.DIAMONDS)]);

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suit.SPADES)]);

    player3.api.requestCards
      .mockResolvedValueOnce([createSuitCard(5, Suit.CLUBS)]);

    const round = await playRound(players, gameState, roomApi, dealerApi);

    expect(round.penalties).toEqual([
      {
        playerId: player1.id,
        card: createSuitCard(5, Suit.DIAMONDS),
      },
      {
        playerId: player2.id,
        card: createSuitCard(5, Suit.SPADES),
      },
      {
        playerId: player3.id,
        card: createSuitCard(5, Suit.CLUBS),
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
      outPlayers: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(8, Suit.CLUBS)],
      [player2.id]: [createSuitCard(9, Suit.HEARTS)],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealerApi.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suit.CLUBS)]);

    player2.api.requestCards
      .mockRejectedValueOnce(new Error('some error happened'));

    const round = await playRound(players, gameState, roomApi, dealerApi);

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
      outPlayers: [],
    };
    const roomApi = createMockedRoomApi();
    const initialHands = {
      [player1.id]: [createSuitCard(7, Suit.DIAMONDS)],
      [player2.id]: [createSuitCard(3, Suit.CLUBS)],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds.mockReturnValueOnce(initialHands);
    dealerApi.samplePlayerId.mockReturnValueOnce(player1.id);

    player1.api.requestCards
      .mockRejectedValueOnce(new Error('some error happened'));

    player2.api.requestCards
      .mockResolvedValueOnce([createSuitCard(3, Suit.CLUBS)]);

    const round = await playRound(players, gameState, roomApi, dealerApi);

    expect(round.penalties).toHaveLength(0);
    expect(round.winner).toEqual(player1.id);
  });
});
