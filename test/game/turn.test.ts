import {
  createJokerCard, createSuitCard, Colors, Suits, Card,
} from 'agurk-shared';
import playTurn from '../../src/game/turn';
import PlayerFactory from '../factories/player';
import PlayerIdFactory from '../factories/playerId';
import createMockedRoomApi from '../mocks/roomApi';
import { CycleState } from '../../src/types/cycle';
import { Hand } from '../../src/types/hand';

describe('play turn', () => {
  test('valid first turn one card', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createSuitCard(10, Suits.DIAMONDS)];
    const playerHand: Hand = [createSuitCard(10, Suits.DIAMONDS)];
    const player = PlayerFactory.build({ id: playerIds[0] });
    player.api.requestCards.mockResolvedValueOnce(playedCards);
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [player.id]: playerHand,
      },
      outPlayers: [],
      playerIds,
    };
    const mockedRoomApi = createMockedRoomApi();

    const validatedTurn = await playTurn(player, cycleState, mockedRoomApi, 0);

    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(validatedTurn);
    expect(validatedTurn).toEqual({
      cards: playedCards,
      playerId: player.id,
      valid: true,
    });
  });

  test('valid not first turn one card', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createSuitCard(3, Suits.SPADES)];
    const playerHand: Hand = [
      createSuitCard(3, Suits.SPADES),
      createSuitCard(6, Suits.DIAMONDS),
    ];
    const player = PlayerFactory.build({ id: playerIds[0] });
    player.api.requestCards.mockResolvedValueOnce(playedCards);
    const cycleState: CycleState = {
      turns: [
        {
          cards: [createSuitCard(3, Suits.HEARTS)],
          playerId: playerIds[1],
          valid: true,
        },
      ],
      hands: {
        [player.id]: playerHand,
      },
      outPlayers: [],
      playerIds,
    };
    const mockedRoomApi = createMockedRoomApi();

    const validatedTurn = await playTurn(player, cycleState, mockedRoomApi, 0);

    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(validatedTurn);
    expect(validatedTurn).toEqual({
      cards: playedCards,
      playerId: player.id,
      valid: true,
    });
  });

  test('invalid turn with card not from hand', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createJokerCard(Colors.BLACK)];
    const playerHand: Hand = [
      createSuitCard(3, Suits.SPADES),
      createSuitCard(6, Suits.DIAMONDS),
    ];
    const player = PlayerFactory.build({ id: playerIds[0] });
    player.api.requestCards.mockResolvedValueOnce(playedCards);
    const cycleState: CycleState = {
      turns: [
        {
          cards: [createSuitCard(11, Suits.CLUBS)],
          playerId: playerIds[1],
          valid: true,
        },
      ],
      hands: {
        [player.id]: playerHand,
      },
      outPlayers: [],
      playerIds,
    };
    const mockedRoomApi = createMockedRoomApi();

    const validatedTurn = await playTurn(player, cycleState, mockedRoomApi, 0);

    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(validatedTurn);
    expect(validatedTurn).toEqual({
      cards: playedCards,
      playerId: player.id,
      valid: false,
      invalidReason: 'not following the game rules',
    });
  });

  test('throws on error while requesting cards', async () => {
    const player = PlayerFactory.build();
    player.api.requestCards.mockRejectedValueOnce(Error('player error'));
    const mockedRoomApi = createMockedRoomApi();

    const validatedTurn = await playTurn(player, {
      outPlayers: [],
      turns: [],
      playerIds: [],
      hands: {},
    }, mockedRoomApi, 0);

    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(validatedTurn);
    expect(validatedTurn).toEqual({
      cards: [],
      playerId: player.id,
      valid: false,
      invalidReason: 'no cards played',
    });
  });
});
