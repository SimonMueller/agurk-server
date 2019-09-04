import { chain, difference } from 'ramda';
import { Penalty } from '../../shared/types/penalty';
import { Player } from '../types/player';
import { OutPlayer, PlayerId } from '../../shared/types/player';
import { Round } from '../types/round';
import { rotate } from '../util';

// TODO: use enum (currently constants because exhaustiveness checking with an enum does not work here -> investigate)
export const SUCCESS_RESULT_KIND = 'SUCCESS';

export const ERROR_RESULT_KIND = 'ERROR';

export const findPlayerIndexByPlayerId = (
  players: Player[],
  playerId: PlayerId,
): number => players.findIndex(player => player.id === playerId);

export const mapPlayersToPlayerIds = (players: Player[]): PlayerId[] => players.map(({ id }) => id);

export const findPenaltiesFromRounds = (
  rounds: Round[],
): Penalty[] => chain(round => round.penalties, rounds);

export const rotatePlayersToPlayerId = (
  players: Player[],
  startingPlayerId: PlayerId,
): Player[] => {
  const startingPlayerIndex = findPlayerIndexByPlayerId(players, startingPlayerId);
  return startingPlayerIndex > 0
    ? rotate(players, startingPlayerIndex)
    : players;
};

export const findActivePlayerIds = (
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
): PlayerId[] => {
  const outPlayerIds = outPlayers.map(outPlayer => outPlayer.id);
  return difference(playerIds, outPlayerIds);
};

export const findPlayersByPlayerIds = (
  players: Player[],
  playerIds: PlayerId[],
): Player[] => players.filter(
  player => playerIds.find(playerId => playerId === player.id),
);

export const findActivePlayers = (
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
  players: Player[],
): Player[] => {
  const activePlayersIds = findActivePlayerIds(playerIds, outPlayers);
  return findPlayersByPlayerIds(players, activePlayersIds);
};
