import * as messageTypes from '../../../shared/communication/messageTypes';

test('message types exist and correct name', () => {
  expect(messageTypes.BROADCAST_PLAYERS.name).toEqual('BROADCAST_PLAYERS');
  expect(messageTypes.START_GAME.name).toEqual('START_GAME');
  expect(messageTypes.BROADCAST_START_GAME.name).toEqual('BROADCAST_START_GAME');
  expect(messageTypes.DEAL_CARDS.name).toEqual('DEAL_CARDS');
  expect(messageTypes.BROADCAST_PLAYER_ORDER.name).toEqual('BROADCAST_PLAYER_ORDER');
  expect(messageTypes.REQUEST_CARDS.name).toEqual('REQUEST_CARDS');
  expect(messageTypes.REQUEST_CARDS.name).toEqual('REQUEST_CARDS');
  expect(messageTypes.BROADCAST_START_PLAYER_TURN.name).toEqual('BROADCAST_START_PLAYER_TURN');
  expect(messageTypes.PLAYED_CARDS.name).toEqual('PLAYED_CARDS');
  expect(messageTypes.BROADCAST_PLAYER_TURN.name).toEqual('BROADCAST_PLAYER_TURN');
  expect(messageTypes.BROADCAST_PLAYER_TURN_ERROR.name).toEqual('BROADCAST_PLAYER_TURN_ERROR');
  expect(messageTypes.BROADCAST_ROUND_WINNER.name).toEqual('BROADCAST_ROUND_WINNER');
  expect(messageTypes.BROADCAST_PENALTIES.name).toEqual('BROADCAST_PENALTIES');
  expect(messageTypes.BROADCAST_OUT_PLAYERS.name).toEqual('BROADCAST_OUT_PLAYERS');
  expect(messageTypes.BROADCAST_GAME_WINNER.name).toEqual('BROADCAST_GAME_WINNER');
  expect(messageTypes.BROADCAST_END_GAME.name).toEqual('BROADCAST_END_GAME');
  expect(messageTypes.BROADCAST_GAME_ERROR.name).toEqual('BROADCAST_GAME_ERROR');
  expect(messageTypes.BROADCAST_END_ROUND.name).toEqual('BROADCAST_END_ROUND');
  expect(messageTypes.BROADCAST_END_CYCLE.name).toEqual('BROADCAST_END_CYCLE');
  expect(messageTypes.BROADCAST_START_ROUND.name).toEqual('BROADCAST_START_ROUND');
  expect(messageTypes.BROADCAST_START_CYCLE.name).toEqual('BROADCAST_START_CYCLE');
  expect(messageTypes.ERROR.name).toEqual('ERROR');
});
