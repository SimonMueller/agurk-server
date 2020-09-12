import { chain } from 'ramda';
import { PlayerId } from 'agurk-shared';
import { Dealer } from '../types/dealer';
import { Player } from '../types/player';
import { GameResult, GameState } from '../types/game';
import { RoomApi } from '../types/room';
import playRound from './round';
import {
  chooseGameWinner, chooseRoundStartingPlayerId, isGameFinished, isValidPlayerCount,
} from './rules';
import {
  findActivePlayers,
  mapPlayersToPlayerIds,
  ERROR_RESULT_KIND,
  SUCCESS_RESULT_KIND,
  rotatePlayersToPlayerId,
} from './common';

const getNewGameState = async (
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealer: Dealer,
): Promise<GameState> => {
  const round = await playRound(
    players,
    gameState.rounds,
    roomApi,
    dealer,
  );
  return {
    ...gameState,
    rounds: [
      ...gameState.rounds,
      round,
    ],
  };
};

async function iterate(
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealer: Dealer,
): Promise<GameState> {
  const startingPlayerId = chooseRoundStartingPlayerId(gameState);

  if (startingPlayerId === undefined) {
    return gameState;
  }

  const orderedPlayers = rotatePlayersToPlayerId(players, startingPlayerId);
  const outPlayers = chain(round => round.outPlayers, gameState.rounds);
  const orderedActivePlayers = findActivePlayers(gameState.playerIds, outPlayers, orderedPlayers);

  const newGameState = await getNewGameState(orderedActivePlayers, gameState, roomApi, dealer);

  return isGameFinished(newGameState)
    ? newGameState
    : iterate(orderedActivePlayers, newGameState, roomApi, dealer);
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
      message: 'no game winner could be determined',
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
      },
      message: 'player count not in valid range of [2, 7]',
    },
  };
}

function broadcastGameResult(gameResult: GameResult, roomApi: RoomApi): void {
  return gameResult.kind === SUCCESS_RESULT_KIND
    ? roomApi.broadcastSuccessEndGame(gameResult.data.winner)
    : roomApi.broadcastErrorEndGame(gameResult.error.message);
}

async function playGame(roomApi: RoomApi, players: Player[], dealer: Dealer): Promise<GameResult> {
  const playerIds = mapPlayersToPlayerIds(players);
  const initialGameState = { playerIds, rounds: [], outPlayers: [] };

  roomApi.broadcastStartGame(playerIds);

  const finishedGameState = await iterate(players, initialGameState, roomApi, dealer);
  const winner = chooseGameWinner(dealer.samplePlayerId, finishedGameState);
  const gameResult = winner !== undefined
    ? createValidGameResult(finishedGameState, winner)
    : createNoWinnerErrorGameResult(finishedGameState);

  broadcastGameResult(gameResult, roomApi);

  return gameResult;
}

export default async function play(
  players: Player[],
  roomApi: RoomApi,
  dealer: Dealer,
): Promise<GameResult> {
  return isValidPlayerCount(players.length)
    ? playGame(roomApi, players, dealer)
    : createInvalidPlayerCountErrorGameResult(players);
}
