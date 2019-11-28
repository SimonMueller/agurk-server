import { groupBy } from 'ramda';
import { PlayerId, Penalty } from 'agurk-shared';
import { DealerApi } from '../types/dealer';
import { Player } from '../types/player';
import { GameResult, GameState } from '../types/game';
import { RoomApi } from '../types/room';
import playRound from './round';
import {
  chooseGameWinner, chooseRoundStartingPlayerId, isGameFinished, isPenaltySumThresholdExceeded, isValidPlayerCount,
} from './rules';
import {
  findActivePlayers,
  findPenaltiesFromRounds,
  mapPlayersToPlayerIds,
  ERROR_RESULT_KIND,
  SUCCESS_RESULT_KIND,
  rotatePlayersToPlayerId,
} from './common';

function findPlayersWithExceededPenaltySumThreshold(penalties: Penalty[]): PlayerId[] {
  const penaltiesByPlayerId = groupBy(penalty => penalty.playerId, penalties);
  return Object.keys(penaltiesByPlayerId).filter((playerId) => {
    const playerPenalties = penaltiesByPlayerId[playerId];
    const playerPenaltyCards = playerPenalties.map(penalty => penalty.card);
    return isPenaltySumThresholdExceeded(playerPenaltyCards);
  });
}

const getNewGameState = async (
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealerApi: DealerApi,
): Promise<GameState> => {
  const round = await playRound(
    players,
    gameState,
    roomApi,
    dealerApi,
  );

  return {
    ...gameState,
    rounds: [
      ...gameState.rounds,
      round,
    ],
    outPlayers: [
      ...gameState.outPlayers,
      ...round.outPlayers,
    ],
  };
};

async function iterate(
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealerApi: DealerApi,
): Promise<GameState> {
  const startingPlayerId = chooseRoundStartingPlayerId(gameState);
  const orderedPlayers = rotatePlayersToPlayerId(players, startingPlayerId);
  const orderedActivePlayers = findActivePlayers(gameState.playerIds, gameState.outPlayers, orderedPlayers);

  const newGameState = await getNewGameState(orderedActivePlayers, gameState, roomApi, dealerApi);

  const penalties = findPenaltiesFromRounds(newGameState.rounds);
  const playerIdsWithExceededPenalty = findPlayersWithExceededPenaltySumThreshold(penalties);
  const outPlayersWithExceededPenalty = playerIdsWithExceededPenalty.map(playerId => ({
    id: playerId, reason: 'penalty threshold exceeded',
  }));

  const currentGameState = {
    ...newGameState,
    outPlayers: [
      ...newGameState.outPlayers,
      ...outPlayersWithExceededPenalty,
    ],
  };

  return isGameFinished(currentGameState)
    ? currentGameState
    : iterate(orderedActivePlayers, currentGameState, roomApi, dealerApi);
}

function createValidGameResult(finishedGameState: GameState, winner: PlayerId): GameResult {
  return {
    kind: SUCCESS_RESULT_KIND,
    data: {
      ...finishedGameState,
      winner,
    },
  };
}

function createNoWinnerErrorGameResult(gameState: GameState): GameResult {
  return {
    kind: ERROR_RESULT_KIND,
    error: {
      gameState,
      message: 'no winner could be determined. game will not be counted.',
    },
  };
}

function createInvalidPlayerCountErrorGameResult(players: Player[]): GameResult {
  const playerIds = mapPlayersToPlayerIds(players);
  return {
    kind: ERROR_RESULT_KIND,
    error: {
      gameState: {
        playerIds,
        rounds: [],
        outPlayers: [],
      },
      message: 'player count not in valid range of [2, 7]',
    },
  };
}

function broadcastGameResult(winner: PlayerId | undefined, roomApi: RoomApi): void {
  roomApi.broadcastEndGame();
  return winner !== undefined
    ? roomApi.broadcastGameWinner(winner)
    : roomApi.broadcastGameError({ error: 'no active players left.' });
}

function broadcastStartGame(roomApi: RoomApi, playerIds: PlayerId[]): void {
  roomApi.broadcastStartGame();
  roomApi.broadcastPlayers(playerIds);
  roomApi.broadcastPlayerOrder(playerIds);
}

async function playGame(roomApi: RoomApi, players: Player[], dealerApi: DealerApi): Promise<GameResult> {
  const playerIds = mapPlayersToPlayerIds(players);
  const initialGameState = { playerIds, rounds: [], outPlayers: [] };

  broadcastStartGame(roomApi, playerIds);

  const finishedGameState = await iterate(players, initialGameState, roomApi, dealerApi);
  const winner = chooseGameWinner(dealerApi.samplePlayerId, finishedGameState);

  broadcastGameResult(winner, roomApi);

  return winner !== undefined
    ? createValidGameResult(finishedGameState, winner)
    : createNoWinnerErrorGameResult(finishedGameState);
}

export default async function (
  players: Player[],
  roomApi: RoomApi,
  dealerApi: DealerApi,
): Promise<GameResult> {
  return isValidPlayerCount(players.length)
    ? playGame(roomApi, players, dealerApi)
    : createInvalidPlayerCountErrorGameResult(players);
}