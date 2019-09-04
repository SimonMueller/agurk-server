import PlayerFactory from '../../factories/player';
import {
  findPlayerIndexByPlayerId,
  rotatePlayersToPlayerId,
  mapPlayersToPlayerIds,
  findPlayersByPlayerIds,
  findActivePlayers,
} from '../../../server/game/common';
import { Player } from '../../../server/types/player';

describe('map players to player ids', () => {
  test('multiple players', () => {
    const players = PlayerFactory.buildList(4);

    expect(mapPlayersToPlayerIds(players)).toEqual([
      players[0].id,
      players[1].id,
      players[2].id,
      players[3].id,
    ]);
  });

  test('empty players', () => {
    const players: Player[] = [];

    expect(mapPlayersToPlayerIds(players)).toEqual([]);
  });
});

describe('find player index by player id', () => {
  test('finds one', () => {
    const players = PlayerFactory.buildList(4);
    const { id } = players[0];

    expect(findPlayerIndexByPlayerId(players, id)).toEqual(0);
  });

  test('finds first match of duplicates', () => {
    const duplicatePlayer = PlayerFactory.build();
    const { id } = duplicatePlayer;
    const players = [
      PlayerFactory.build(),
      duplicatePlayer,
      PlayerFactory.build(),
      duplicatePlayer,
    ];

    expect(findPlayerIndexByPlayerId(players, id)).toEqual(1);
  });

  test('negative if no match', () => {
    const players = PlayerFactory.buildList(4);

    expect(findPlayerIndexByPlayerId(players, 'someplayerId')).toBeLessThan(0);
  });
});

describe('rotate players to id', () => {
  test('multiple players and id matches first player', () => {
    const players = PlayerFactory.buildList(4);
    const { id } = players[0];

    expect(rotatePlayersToPlayerId(players, id)).toEqual(players);
  });

  test('multiple players and id not from first player', () => {
    const players = PlayerFactory.buildList(3);
    const { id } = players[1];

    expect(rotatePlayersToPlayerId(players, id))
      .toEqual([players[1], players[2], players[0]]);
  });

  test('multiple players and id from last player', () => {
    const players = PlayerFactory.buildList(4);
    const { id } = players[3];

    expect(rotatePlayersToPlayerId(players, id))
      .toEqual([players[3], players[0], players[1], players[2]]);
  });

  test('empty players and no player has id', () => {
    const players: Player[] = [];
    const playerId = 'something';

    expect(rotatePlayersToPlayerId(players, playerId)).toEqual([]);
  });

  test('unknown playerid returns same order', () => {
    const players = PlayerFactory.buildList(4);
    const playerId = 'something';

    expect(rotatePlayersToPlayerId(players, playerId)).toEqual(players);
  });
});

describe('find players by player ids', () => {
  test('multiple matches', () => {
    const players = PlayerFactory.buildList(4);
    const playerIds = [players[0].id, players[3].id];

    expect(findPlayersByPlayerIds(players, playerIds)).toEqual([
      players[0],
      players[3],
    ]);
  });

  test('no matches', () => {
    const players = PlayerFactory.buildList(4);
    const playerIds = ['someplayer', 'anotherplayer'];

    expect(findPlayersByPlayerIds(players, playerIds)).toEqual([]);
  });
});

describe('find active players', () => {
  test('no out players results in same players', () => {
    const players = PlayerFactory.buildList(4);
    const playerIds = players.map(player => player.id);

    expect(findActivePlayers(playerIds, [], players)).toEqual(players);
  });

  test('all out players results in empty active players', () => {
    const players = PlayerFactory.buildList(2);
    const playerIds = players.map(player => player.id);
    const outPlayers = playerIds.map(playerId => ({ id: playerId, reason: 'test' }));

    expect(findActivePlayers(playerIds, outPlayers, players)).toEqual([]);
  });

  test('some out players results in only active players', () => {
    const players = PlayerFactory.buildList(2);
    const playerIds = players.map(player => player.id);
    const outPlayers = [{ id: playerIds[0], reason: 'test' }];

    expect(findActivePlayers(playerIds, outPlayers, players)).toEqual([players[1]]);
  });

  test('all empty results in empty players', () => {
    expect(findActivePlayers([], [], [])).toEqual([]);
  });
});
