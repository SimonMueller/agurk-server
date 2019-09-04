import createMessage from '../../../shared/communication/messages';
import * as messageTypes from '../../../shared/communication/messageTypes';
import { createSuitCard, Suit } from '../../../shared/game/card';
import { Turn, TurnError } from '../../../server/types/turn';
import { OutPlayer, PlayerId } from '../../../shared/types/player';
import { Penalty } from '../../../shared/types/penalty';
import { Card } from '../../../shared/types/card';

describe('create message', () => {
  test('broadcast players game message with type and players data', () => {
    const players: PlayerId[] = ['player'];

    expect(createMessage(messageTypes.BROADCAST_PLAYERS, players))
      .toEqual({
        type: messageTypes.BROADCAST_PLAYERS.name,
        data: players,
      });
  });

  test('broadcast start game message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_START_GAME))
      .toEqual({
        type: messageTypes.BROADCAST_START_GAME.name,
      });
  });

  test('broadcast game error message with type and game error data', () => {
    const error = { error: 'something is wrong' };

    expect(createMessage(messageTypes.BROADCAST_GAME_ERROR, error))
      .toEqual({
        type: messageTypes.BROADCAST_GAME_ERROR.name,
        data: error,
      });
  });


  test('deal cards message with type and cards data', () => {
    const cards: Card[] = [createSuitCard(2, Suit.DIAMONDS)];

    expect(createMessage(messageTypes.DEAL_CARDS, cards))
      .toEqual({
        type: messageTypes.DEAL_CARDS.name,
        data: cards,
      });
  });

  test('broadcast player order message with type and player order data', () => {
    const players: PlayerId[] = ['player1', 'player2'];

    expect(createMessage(messageTypes.BROADCAST_PLAYER_ORDER, players))
      .toEqual({
        type: messageTypes.BROADCAST_PLAYER_ORDER.name,
        data: players,
      });
  });

  test('request cards message with only type', () => {
    expect(createMessage(messageTypes.REQUEST_CARDS))
      .toEqual({
        type: messageTypes.REQUEST_CARDS.name,
      });
  });

  test('played cards message with type and played cards data', () => {
    const cards: Card[] = [createSuitCard(2, Suit.CLUBS)];

    expect(createMessage(messageTypes.PLAYED_CARDS, cards))
      .toEqual({
        type: messageTypes.PLAYED_CARDS.name,
        data: cards,
      });
  });

  test('broadcast turn played message with type and turn data', () => {
    const turn: Turn = { cards: [createSuitCard(2, Suit.HEARTS)], playerId: 'test' };

    expect(createMessage(messageTypes.BROADCAST_PLAYER_TURN, turn))
      .toEqual({
        type: messageTypes.BROADCAST_PLAYER_TURN.name,
        data: turn,
      });
  });

  test('broadcast error turn message with type and turn error including player id', () => {
    const turnError: TurnError = { message: 'an error in a player turn occured', playerId: 'test' };

    expect(createMessage(messageTypes.BROADCAST_PLAYER_TURN_ERROR, turnError))
      .toEqual({
        type: messageTypes.BROADCAST_PLAYER_TURN_ERROR.name,
        data: turnError,
      });
  });

  test('broadcast round winner message with type and winner data', () => {
    const winner: PlayerId = 'player2';

    expect(createMessage(messageTypes.BROADCAST_ROUND_WINNER, winner))
      .toEqual({
        type: messageTypes.BROADCAST_ROUND_WINNER.name,
        data: winner,
      });
  });

  test('broadcast penalties message with type and penalties data', () => {
    const penalties: Penalty[] = [{ playerId: 'tester', card: createSuitCard(12, Suit.HEARTS) }];

    expect(createMessage(messageTypes.BROADCAST_PENALTIES, penalties))
      .toEqual({
        type: messageTypes.BROADCAST_PENALTIES.name,
        data: penalties,
      });
  });

  test('broadcast out players message with type and out players data', () => {
    const outPlayers: OutPlayer[] = [{ id: 'outPlayer', reason: 'cheating' }];

    expect(createMessage(messageTypes.BROADCAST_OUT_PLAYERS, outPlayers))
      .toEqual({
        type: messageTypes.BROADCAST_OUT_PLAYERS.name,
        data: outPlayers,
      });
  });

  test('broadcast game winner message with type and game winner data', () => {
    const winner: PlayerId = 'player2';

    expect(createMessage(messageTypes.BROADCAST_GAME_WINNER, winner))
      .toEqual({
        type: messageTypes.BROADCAST_GAME_WINNER.name,
        data: winner,
      });
  });

  test('broadcast end round message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_END_ROUND))
      .toEqual({
        type: messageTypes.BROADCAST_END_ROUND.name,
      });
  });

  test('broadcast end game message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_END_GAME))
      .toEqual({
        type: messageTypes.BROADCAST_END_GAME.name,
      });
  });

  test('broadcast end cycle message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_END_CYCLE))
      .toEqual({
        type: messageTypes.BROADCAST_END_CYCLE.name,
      });
  });

  test('broadcast start round message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_START_ROUND))
      .toEqual({
        type: messageTypes.BROADCAST_START_ROUND.name,
      });
  });

  test('broadcast start cycle message with only type', () => {
    expect(createMessage(messageTypes.BROADCAST_START_CYCLE))
      .toEqual({
        type: messageTypes.BROADCAST_START_CYCLE.name,
      });
  });

  test('broadcast start player turn message with type and data', () => {
    const playerId = 'someplayer';

    expect(createMessage(messageTypes.BROADCAST_START_PLAYER_TURN, playerId))
      .toEqual({
        type: messageTypes.BROADCAST_START_PLAYER_TURN.name,
        data: playerId,
      });
  });

  test('error message with type and error data', () => {
    const error = { error: 'something is wrong' };

    expect(createMessage(messageTypes.ERROR, error))
      .toEqual({
        type: messageTypes.ERROR.name,
        data: error,
      });
  });

  test('start game message with only type', () => {
    expect(createMessage(messageTypes.START_GAME))
      .toEqual({
        type: messageTypes.START_GAME.name,
      });
  });
});
