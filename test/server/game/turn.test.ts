import playTurn from '../../../server/game/turn';
import PlayerFactory from '../../factories/player';
import PlayerIdFactory from '../../factories/playerId';
import createMockedRoomApi from '../../mocks/roomApi';
import TurnFactory from '../../factories/turn';
import { FailedResult, SuccessResult } from '../../../server/types/result';
import { TurnError } from '../../../server/types/turn';
import { ValidatedTurn } from '../../../shared/types/turn';
import { CycleState } from '../../../server/types/cycle';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';
import { Hand } from '../../../server/types/hand';
import { Card } from '../../../shared/types/card';

describe('play turn', () => {
  test('valid first turn one card', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createSuitCard(10, Suit.DIAMONDS)];
    const playerHand: Hand = [createSuitCard(10, Suit.DIAMONDS)];
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

    const turnResult = await playTurn(player, cycleState, mockedRoomApi) as SuccessResult<ValidatedTurn>;

    expect(turnResult.data).toBeDefined();
    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(turnResult.data);
    expect(turnResult.data).toEqual({
      cards: playedCards,
      playerId: player.id,
      valid: true,
    });
  });

  test('valid not first turn one card', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createSuitCard(3, Suit.SPADES)];
    const playerHand: Hand = [
      createSuitCard(3, Suit.SPADES),
      createSuitCard(6, Suit.DIAMONDS),
    ];
    const player = PlayerFactory.build({ id: playerIds[0] });
    player.api.requestCards.mockResolvedValueOnce(playedCards);
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(3, Suit.HEARTS)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [player.id]: playerHand,
      },
      outPlayers: [],
      playerIds,
    };
    const mockedRoomApi = createMockedRoomApi();

    const turnResult = await playTurn(player, cycleState, mockedRoomApi) as SuccessResult<ValidatedTurn>;

    expect(turnResult.data).toBeDefined();
    expect(mockedRoomApi.broadcastPlayerTurn).toHaveBeenCalledWith(turnResult.data);
    expect(turnResult.data).toEqual({
      cards: playedCards,
      playerId: player.id,
      valid: true,
    });
  });

  test('invalid turn with card not from hand', async () => {
    const playerIds = PlayerIdFactory.buildList(3);
    const playedCards: Card[] = [createJokerCard(Color.BLACK)];
    const playerHand: Hand = [
      createSuitCard(3, Suit.SPADES),
      createSuitCard(6, Suit.DIAMONDS),
    ];
    const player = PlayerFactory.build({ id: playerIds[0] });
    player.api.requestCards.mockResolvedValueOnce(playedCards);
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(11, Suit.CLUBS)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [player.id]: playerHand,
      },
      outPlayers: [],
      playerIds,
    };
    const mockedRoomApi = createMockedRoomApi();

    const turnResult = await playTurn(player, cycleState, mockedRoomApi) as FailedResult<TurnError>;

    expect(turnResult.error).toBeDefined();
    expect(mockedRoomApi.broadcastPlayerTurnError).toHaveBeenCalledWith(turnResult.error);
    expect(turnResult.error).toEqual({
      playerId: player.id,
      message: 'player is not following the game rules',
    });
  });

  test('throws on error while requesting cards', async () => {
    const player = PlayerFactory.build();
    player.api.requestCards.mockRejectedValueOnce(Error('player error'));
    const mockedRoomApi = createMockedRoomApi();

    const turnResult = await playTurn(player, {
      outPlayers: [],
      turns: [],
      playerIds: [],
      hands: {},
    }, mockedRoomApi) as FailedResult<TurnError>;

    expect(turnResult.error).toBeDefined();
    expect(mockedRoomApi.broadcastPlayerTurnError).toHaveBeenCalledWith(turnResult.error);
    expect(turnResult.error).toEqual({
      playerId: player.id,
      message: 'problem requesting cards from player',
    });
  });
});
