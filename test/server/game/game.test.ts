import createMockedDealerApi from '../../mocks/dealerApi';
import PlayerFactory from '../../factories/player';
import playGame from '../../../server/game/game';
import createMockedRoomApi from '../../mocks/roomApi';
import { PlayerId } from '../../../shared/types/player';
import { FailedResult, SuccessResult } from '../../../server/types/result';
import { Game, GameError } from '../../../server/types/game';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';
import { PlayerHands } from '../../../server/types/hand';

describe('play game', () => {
  test('game with only 1 player cannot be started', async () => {
    const players = PlayerFactory.buildList(1);
    const roomApi = createMockedRoomApi();
    const dealerApi = createMockedDealerApi();
    const gameResult = await playGame(players, roomApi, dealerApi) as FailedResult<GameError>;

    expect(gameResult.error).toBeDefined();
    expect(gameResult.error.message).toContain('player count not in valid range');
  });

  test('game with more than 7 players cannot be started', async () => {
    const players = PlayerFactory.buildList(8);
    const roomApi = createMockedRoomApi();
    const dealerApi = createMockedDealerApi();

    const gameResult = await playGame(players, roomApi, dealerApi) as FailedResult<GameError>;

    expect(gameResult.error).toBeDefined();
    expect(gameResult.error.message).toContain('player count not in valid range');
  });

  test('game with 2 players', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const playerIds = [player1.id, player2.id];
    const roomApi = createMockedRoomApi();
    const initialHandsRound1: PlayerHands = {
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

    const initialHandsRound2: PlayerHands = {
      [player1.id]: [
        createSuitCard(3, Suit.SPADES),
        createSuitCard(4, Suit.SPADES),
        createSuitCard(5, Suit.SPADES),
        createSuitCard(6, Suit.SPADES),
        createSuitCard(7, Suit.SPADES),
        createSuitCard(8, Suit.SPADES),
      ],
      [player2.id]: [
        createSuitCard(3, Suit.CLUBS),
        createSuitCard(4, Suit.CLUBS),
        createSuitCard(5, Suit.CLUBS),
        createSuitCard(6, Suit.CLUBS),
        createSuitCard(7, Suit.CLUBS),
        createJokerCard(Color.BLACK),
      ],
    };
    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds
      .mockReturnValueOnce(initialHandsRound1)
      .mockReturnValueOnce(initialHandsRound2);
    dealerApi.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      // round 1
      .mockResolvedValueOnce([createSuitCard(8, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(2, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.HEARTS)])
      // round 2
      .mockResolvedValueOnce([createSuitCard(8, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.SPADES)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.SPADES)]);
    player2.api.requestCards
      // round 1
      .mockResolvedValueOnce([createSuitCard(2, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(3, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(8, Suit.DIAMONDS)])
      // round 2
      .mockResolvedValueOnce([createSuitCard(3, Suit.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(4, Suit.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(5, Suit.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(6, Suit.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(7, Suit.CLUBS)])
      .mockResolvedValueOnce([createJokerCard(Color.BLACK)]);

    const gameResult = await playGame(players, roomApi, dealerApi) as SuccessResult<Game>;

    expect(gameResult.data).toBeDefined();
    expect(gameResult.data).toMatchObject({
      playerIds,
      winner: player1.id,
      outPlayers: [{
        id: player2.id,
        reason: 'penalty threshold exceeded',
      }],
    });
  });

  test('bubbling up of round out players', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const roomApi = createMockedRoomApi();
    const initialHandsRound1: PlayerHands = {
      [player1.id]: [createSuitCard(8, Suit.HEARTS)],
      [player2.id]: [createSuitCard(2, Suit.DIAMONDS)],
    };

    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds
      .mockReturnValueOnce(initialHandsRound1);

    player1.api.requestCards
      .mockResolvedValueOnce([createSuitCard(8, Suit.HEARTS)]);

    player2.api.requestCards
      .mockRejectedValueOnce(new Error('some error occurred'));

    const gameResult = await playGame(players, roomApi, dealerApi) as SuccessResult<Game>;

    expect(gameResult.data).toBeDefined();
    expect(gameResult.data.outPlayers).toEqual([{
      id: player2.id,
      reason: 'problem requesting cards from player',
    }]);
  });

  test('all players out because of errors. error game with incomplete game state.', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const roomApi = createMockedRoomApi();
    const initialHandsRound1: PlayerHands = {
      [player1.id]: [createSuitCard(8, Suit.HEARTS)],
      [player2.id]: [createSuitCard(2, Suit.DIAMONDS)],
    };

    const dealerApi = createMockedDealerApi();
    dealerApi.createHandsForPlayerIds
      .mockReturnValueOnce(initialHandsRound1);

    player1.api.requestCards
      .mockRejectedValueOnce(new Error('some error occurred'));

    player2.api.requestCards
      .mockRejectedValueOnce(new Error('some error occurred'));

    const gameResult = await playGame(players, roomApi, dealerApi) as FailedResult<GameError>;

    expect(gameResult.error).toBeDefined();
  });
});
