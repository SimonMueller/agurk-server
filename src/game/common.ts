import { chain, difference } from 'ramda';
import { Penalty, OutPlayer, PlayerId } from 'agurk-shared';
import { Player } from '../types/player';
import { Round } from '../types/round';
import { rotate } from '../util';

// TODO: use enum (currently constants because exhaustiveness checking with an enum does not work here -> investigate)
export const SUCCESS_RESULT_KIND = 'SUCCESS';

export const ERROR_RESULT_KIND = 'ERROR';

export function findPlayerIndexByPlayerId(players: Player[], playerId: PlayerId): number {
  return players.findIndex(player => player.id === playerId);
}

export function mapPlayersToPlayerIds(players: Player[]): PlayerId[] {
  return players.map(({ id }) => id);
}

export function findPenaltiesFromRounds(rounds: Round[]): Penalty[] {
  return chain(round => round.penalties, rounds);
}

export function rotatePlayersToPlayerId(players: Player[], startingPlayerId: PlayerId): Player[] {
  const startingPlayerIndex = findPlayerIndexByPlayerId(players, startingPlayerId);
  return startingPlayerIndex > 0
    ? rotate(players, startingPlayerIndex)
    : players;
}

export function findActivePlayerIds(playerIds: PlayerId[], outPlayers: OutPlayer[]): PlayerId[] {
  const outPlayerIds = outPlayers.map(outPlayer => outPlayer.id);
  return difference(playerIds, outPlayerIds);
}

export function findPlayersByPlayerIds(players: Player[], playerIds: PlayerId[]): Player[] {
  return players.filter(
    player => playerIds.find(playerId => playerId === player.id),
  );
}

export function findActivePlayers(
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
  players: Player[],
): Player[] {
  const activePlayersIds = findActivePlayerIds(playerIds, outPlayers);
  return findPlayersByPlayerIds(players, activePlayersIds);
}
