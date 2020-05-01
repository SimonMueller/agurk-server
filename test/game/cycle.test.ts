import {
  createJokerCard, createSuitCard, Colors, Suits, Card, ValidatedTurn, OutPlayer,
} from 'agurk-shared';
import PlayerFactory from '../factories/player';
import createMockedRoomApi from '../mocks/roomApi';
import playCycle from '../../src/game/cycle';
import { RoundState } from '../../src/types/round';
import { Hand } from '../../src/types/hand';

describe('play cycle', () => {
  test('valid first cycle result', async () => {
    const player1Hand: Hand = [
      createSuitCard(9, Suits.CLUBS),
      createSuitCard(2, Suits.HEARTS),
      createSuitCard(14, Suits.DIAMONDS),
    ];
    const player2Hand: Hand = [
      createSuitCard(8, Suits.SPADES),
      createJokerCard(Colors.BLACK),
      createSuitCard(10, Suits.SPADES),
    ];
    const player1PlayedCards = [player1Hand[0]];
    const player2PlayedCards = [player2Hand[0]];
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();

    player1.api.requestCards.mockResolvedValueOnce(Promise.resolve(player1PlayedCards));
    player2.api.requestCards.mockResolvedValueOnce(Promise.resolve(player2PlayedCards));

    const roundState: RoundState = {
      cycles: [],
      outPlayers: [],
      initialHands: {
        [player1.id]: player1Hand,
        [player2.id]: player2Hand,
      },
      playerIds: [player1.id, player2.id],
    };
    const playerIds = [player1, player2];

    const cycle = await playCycle(playerIds, roundState, createMockedRoomApi());

    const expectedPlayer1Turn = {
      cards: player1PlayedCards, playerId: player1.id, valid: true,
    };
    const expectedPlayer2Turn = {
      cards: player2PlayedCards, playerId: player2.id, valid: true,
    };

    expect(cycle).toEqual({
      turns: [expectedPlayer1Turn, expectedPlayer2Turn],
      hands: {
        [player1.id]: player1Hand,
        [player2.id]: player2Hand,
      },
      playerIds: [player1.id, player2.id],
      outPlayers: [],
      highestTurns: [expectedPlayer1Turn],
      lowestTurns: [expectedPlayer2Turn],
    });
  });

  test('all players out because no valid turns in cycle ', async () => {
    const player1Hand: Hand = [createSuitCard(9, Suits.CLUBS)];
    const player2Hand: Hand = [createSuitCard(10, Suits.SPADES)];
    const player1PlayedCards = [createSuitCard(4, Suits.CLUBS)];
    const player2PlayedCards = [createSuitCard(14, Suits.DIAMONDS)];
    const player1 = PlayerFactory.build();
    const player2 = PlayerFactory.build();

    player1.api.requestCards.mockResolvedValue(Promise.resolve(player1PlayedCards));
    player2.api.requestCards.mockResolvedValue(Promise.resolve(player2PlayedCards));

    const roundState: RoundState = {
      cycles: [],
      outPlayers: [],
      initialHands: {
        [player1.id]: player1Hand,
        [player2.id]: player2Hand,
      },
      playerIds: [player1.id, player2.id],
    };
    const playerIds = [player1, player2];

    const cycle = await playCycle(playerIds, roundState, createMockedRoomApi());
    await expect(cycle.outPlayers).toEqual([
      {
        id: player1.id,
        reason: 'not following the game rules',
      },
      {
        id: player2.id,
        reason: 'not following the game rules',
      },
    ]);
  });

  test('valid turn after retry', async () => {
    const invalidPlayedCards: Card[] = [createJokerCard(Colors.BLACK)];
    const validPlayedCards: Card[] = [createSuitCard(3, Suits.SPADES)];
    const playerHand: Hand = [createSuitCard(3, Suits.SPADES)];
    const player = PlayerFactory.build();
    const roundState: RoundState = {
      cycles: [],
      outPlayers: [],
      initialHands: {
        [player.id]: playerHand,
      },
      playerIds: [player.id],
    };
    const mockedRoomApi = createMockedRoomApi();

    player.api.requestCards.mockResolvedValueOnce(invalidPlayedCards);
    player.api.requestCards.mockResolvedValueOnce(validPlayedCards);

    const cycle = await playCycle([player], roundState, mockedRoomApi);

    expect(cycle.turns).toEqual([
      {
        cards: invalidPlayedCards,
        playerId: player.id,
        valid: false,
        invalidReason: 'not following the game rules',
      },
      {
        cards: validPlayedCards,
        playerId: player.id,
        valid: true,
      },
    ]);
  });

  test('valid turn with card from invalid turn from previous cycle', async () => {
    const player = PlayerFactory.build();
    const invalidTurn: ValidatedTurn = {
      playerId: player.id,
      cards: [createSuitCard(3, Suits.SPADES), createSuitCard(5, Suits.DIAMONDS)],
      valid: false,
      invalidReason: 'not following the game rules',
    };
    const validTurn: ValidatedTurn = {
      playerId: player.id,
      cards: [createSuitCard(5, Suits.DIAMONDS)],
      valid: true,
    };
    const validPlayedCards: Card[] = [createSuitCard(3, Suits.SPADES)];
    const playerHand: Hand = [createSuitCard(3, Suits.SPADES), createSuitCard(5, Suits.DIAMONDS)];
    const roundState: RoundState = {
      cycles: [{
        hands: {
          [player.id]: playerHand,
        },
        outPlayers: [],
        playerIds: [player.id],
        turns: [invalidTurn, validTurn],
        highestTurns: [validTurn],
        lowestTurns: [validTurn],
      }],
      outPlayers: [],
      initialHands: {
        [player.id]: playerHand,
      },
      playerIds: [player.id],
    };
    const mockedRoomApi = createMockedRoomApi();

    player.api.requestCards.mockResolvedValueOnce(validPlayedCards);

    const cycle = await playCycle([player], roundState, mockedRoomApi);

    expect(cycle.turns).toEqual([
      {
        cards: validPlayedCards,
        playerId: player.id,
        valid: true,
      },
    ]);
  });

  test('player is out after cycle because playing card not from hand', async () => {
    const player1Hand: Hand = [createSuitCard(9, Suits.CLUBS)];
    const player1 = PlayerFactory.build();
    const roomApi = createMockedRoomApi();

    player1.api.requestCards.mockResolvedValue([createJokerCard(Colors.BLACK)]);

    const roundState: RoundState = {
      cycles: [],
      outPlayers: [],
      initialHands: {
        [player1.id]: player1Hand,
      },
      playerIds: [player1.id],
    };
    const playerIds = [player1];

    const cycle = await playCycle(playerIds, roundState, roomApi);

    const expectedOutPlayer: OutPlayer = {
      id: player1.id,
      reason: 'not following the game rules',
    };
    expect(roomApi.broadcastOutPlayerAfterTurn).toHaveBeenCalledWith(expectedOutPlayer);
    expect(cycle.outPlayers).toEqual([expectedOutPlayer]);
  });
});
