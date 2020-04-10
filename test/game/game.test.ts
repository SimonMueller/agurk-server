import {
  PlayerId, createJokerCard, createSuitCard, Colors, Suits,
} from 'agurk-shared';
import { last } from 'ramda';
import createMockedDealer from '../mocks/dealer';
import PlayerFactory from '../factories/player';
import playGame from '../../src/game/game';
import createMockedRoomApi from '../mocks/roomApi';
import { ErrorResult, SuccessResult } from '../../src/types/result';
import { Game, GameError } from '../../src/types/game';
import { PlayerHands } from '../../src/types/hand';

describe('play game', () => {
  test('game with only 1 player cannot be started', async () => {
    const players = PlayerFactory.buildList(1);
    const roomApi = createMockedRoomApi();
    const dealer = createMockedDealer();
    const gameResult = await playGame(players, roomApi, dealer) as ErrorResult<GameError>;

    expect(gameResult.error).toBeDefined();
    expect(gameResult.error.message).toContain('player count not in valid range');
  });

  test('game with more than 7 players cannot be started', async () => {
    const players = PlayerFactory.buildList(8);
    const roomApi = createMockedRoomApi();
    const dealer = createMockedDealer();

    const gameResult = await playGame(players, roomApi, dealer) as ErrorResult<GameError>;

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

    const initialHandsRound2: PlayerHands = {
      [player1.id]: [
        createSuitCard(3, Suits.SPADES),
        createSuitCard(4, Suits.SPADES),
        createSuitCard(5, Suits.SPADES),
        createSuitCard(6, Suits.SPADES),
        createSuitCard(7, Suits.SPADES),
        createSuitCard(8, Suits.SPADES),
      ],
      [player2.id]: [
        createSuitCard(3, Suits.CLUBS),
        createSuitCard(4, Suits.CLUBS),
        createSuitCard(5, Suits.CLUBS),
        createSuitCard(6, Suits.CLUBS),
        createSuitCard(7, Suits.CLUBS),
        createJokerCard(Colors.BLACK),
      ],
    };
    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds
      .mockReturnValueOnce(initialHandsRound1)
      .mockReturnValueOnce(initialHandsRound2);
    dealer.samplePlayerId.mockImplementation((array: PlayerId[]) => array[0]);

    player1.api.requestCards
      // round 1
      .mockResolvedValueOnce([createSuitCard(8, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(2, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.HEARTS)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.HEARTS)])
      // round 2
      .mockResolvedValueOnce([createSuitCard(8, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.SPADES)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.SPADES)]);
    player2.api.requestCards
      // round 1
      .mockResolvedValueOnce([createSuitCard(2, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(3, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.DIAMONDS)])
      .mockResolvedValueOnce([createSuitCard(8, Suits.DIAMONDS)])
      // round 2
      .mockResolvedValueOnce([createSuitCard(3, Suits.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(4, Suits.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(5, Suits.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(6, Suits.CLUBS)])
      .mockResolvedValueOnce([createSuitCard(7, Suits.CLUBS)])
      .mockResolvedValueOnce([createJokerCard(Colors.BLACK)]);

    const gameResult = await playGame(players, roomApi, dealer) as SuccessResult<Game>;

    expect(gameResult.data).toBeDefined();
    expect(gameResult.data).toMatchObject({
      playerIds,
      winner: player1.id,
    });
    expect(last(gameResult.data.rounds)).toMatchObject({
      outPlayers: [{
        id: player2.id,
        reason: 'penalty threshold exceeded',
      }],
    });
  });

  test('all players out because of errors. error game with incomplete game state.', async () => {
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();
    const players = [player1, player2];
    const roomApi = createMockedRoomApi();
    const initialHandsRound1: PlayerHands = {
      [player1.id]: [createSuitCard(8, Suits.HEARTS)],
      [player2.id]: [createSuitCard(2, Suits.DIAMONDS)],
    };

    const dealer = createMockedDealer();
    dealer.createHandsForPlayerIds
      .mockReturnValueOnce(initialHandsRound1);

    player1.api.requestCards
      .mockRejectedValue(new Error('some error occurred'));

    player2.api.requestCards
      .mockRejectedValue(new Error('some error occurred'));

    const gameResult = await playGame(players, roomApi, dealer) as ErrorResult<GameError>;

    expect(gameResult.error).toBeDefined();
  });
});
