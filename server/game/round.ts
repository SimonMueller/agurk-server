import { chain, last, partial } from 'ramda';
import { PlayerId } from '../../shared/types/player';
import { DealerApi } from '../types/dealer';
import { Player } from '../types/player';
import { GameState } from '../types/game';
import { RoomApi } from '../types/room';
import {
  Round, RoundState,
} from '../types/round';
import playCycle from './cycle';
import {
  isRoundFinished,
  chooseCycleStartingPlayerId,
  chooseRoundWinner,
  calculateCardCountToDeal,
} from './rules';
import {
  mapPlayersToPlayerIds, rotatePlayersToPlayerId, findActivePlayers, findPenaltiesFromRounds,
} from './common';
import { ValidatedTurn } from '../../shared/types/turn';
import { Card } from '../../shared/types/card';
import { Penalty } from '../../shared/types/penalty';

const createPenaltyFor = (playerId: PlayerId, card: Card): Penalty => ({ card, playerId });

const createPenaltiesFromTurn = (
  turn: ValidatedTurn,
): Penalty[] => turn.cards.map(partial(createPenaltyFor, [turn.playerId]));

const createPenaltiesFromTurns = (
  turns: ValidatedTurn[],
): Penalty[] => chain(createPenaltiesFromTurn, turns);

const findPenaltyCardsFromRounds = (rounds: Round[]): Card[] => {
  const roundPenalties = findPenaltiesFromRounds(rounds);
  return roundPenalties.map(penalty => penalty.card);
};

const iterate = async (
  players: Player[],
  roundState: RoundState,
  roomApi: RoomApi,
): Promise<RoundState> => {
  const startingPlayerId = chooseCycleStartingPlayerId(roundState);
  const orderedPlayers = rotatePlayersToPlayerId(players, startingPlayerId);
  const orderedActivePlayers = findActivePlayers(roundState.playerIds, roundState.outPlayers, orderedPlayers);

  const cycle = await playCycle(orderedActivePlayers, roundState, roomApi);

  const newRoundState = {
    ...roundState,
    cycles: [
      ...roundState.cycles,
      cycle,
    ],
    outPlayers: [
      ...roundState.outPlayers,
      ...cycle.outPlayers,
    ],
  };

  return isRoundFinished(newRoundState)
    ? newRoundState
    : iterate(orderedActivePlayers, newRoundState, roomApi);
};

const broadcastFinishedRound = (
  roomApi: RoomApi,
  winner: PlayerId,
  penalties: Penalty[],
  finishedRoundState: RoundState,
): void => {
  roomApi.broadcastEndRound();
  roomApi.broadcastRoundWinner(winner);
  roomApi.broadcastPenalties(penalties);
  roomApi.broadcastOutPlayers(finishedRoundState.outPlayers);
};

const findLoosingRoundTurns = (roundState: RoundState): ValidatedTurn[] => {
  const { cycles } = roundState;
  const lastCycle = last(cycles);
  const moreThanOneTurnPlayed = lastCycle && lastCycle.turns.length > 1;
  return moreThanOneTurnPlayed
    ? lastCycle.highestTurns
    : [];
};

const finishRound = (
  finishedRoundState: RoundState,
  dealerApi: DealerApi,
  roomApi: RoomApi,
): Round => {
  const winner = chooseRoundWinner(finishedRoundState, dealerApi.samplePlayerId);
  const loosingTurns = findLoosingRoundTurns(finishedRoundState);
  const penalties = createPenaltiesFromTurns(loosingTurns);

  broadcastFinishedRound(roomApi, winner, penalties, finishedRoundState);

  return {
    ...finishedRoundState,
    winner,
    penalties,
  };
};

const broadcastStartRound = (roomApi: RoomApi, playerIds: PlayerId[]): void => {
  roomApi.broadcastStartRound();
  roomApi.broadcastPlayers(playerIds);
  roomApi.broadcastPlayerOrder(playerIds);
};

export default async (
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealerApi: DealerApi,
): Promise<Round> => {
  const playerIds = mapPlayersToPlayerIds(players);

  broadcastStartRound(roomApi, playerIds);

  const { rounds } = gameState;
  const penaltyCards = findPenaltyCardsFromRounds(rounds);
  const roundCount = rounds.length;
  const cardCountToDeal = calculateCardCountToDeal(roundCount);
  const playerHands = dealerApi.createHandsForPlayerIds(playerIds, penaltyCards, cardCountToDeal);

  players.forEach((player) => {
    const hand = playerHands[player.id];
    player.api.dealCards(hand);
  });

  const finishedRoundState = await iterate(players, {
    cycles: [],
    initialHands: playerHands,
    playerIds,
    outPlayers: [],
  }, roomApi);

  return finishRound(finishedRoundState, dealerApi, roomApi);
};
