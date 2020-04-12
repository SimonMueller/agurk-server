import {
  chain, groupBy, last, partial,
} from 'ramda';
import {
  Card, Penalty, PlayerId, ValidatedTurn, ValidTurn,
} from 'agurk-shared';
import config from 'config';
import { Dealer } from '../types/dealer';
import { Player } from '../types/player';
import { RoomApi } from '../types/room';
import { Round, RoundState } from '../types/round';
import playCycle from './cycle';
import {
  calculateCardCountToDeal,
  chooseCycleStartingPlayerId,
  chooseRoundWinner,
  isPenaltySumThresholdExceeded,
  isRoundFinished, shouldIssuePenalties,
} from './rules';
import {
  findActivePlayers, findPenaltiesFromRounds, mapPlayersToPlayerIds, rotatePlayersToPlayerId,
} from './common';
import { delay } from '../util';

const DELAY_AFTER_ROUND_IN_MILLIS: number = config.get('server.delayAfterRoundInMillis');

const createPenaltyFor = (playerId: PlayerId, card: Card): Penalty => ({ card, playerId });

function createPenaltiesFromTurn(turn: ValidatedTurn): Penalty[] {
  return turn.cards.map(partial(createPenaltyFor, [turn.playerId]));
}

function createPenaltiesFromTurns(turns: ValidatedTurn[]): Penalty[] {
  return chain(createPenaltiesFromTurn, turns);
}

function findPenaltyCardsFromRounds(rounds: Round[]): Card[] {
  const roundPenalties = findPenaltiesFromRounds(rounds);
  return roundPenalties.map(penalty => penalty.card);
}

async function iterate(
  players: Player[],
  roundState: RoundState,
  roomApi: RoomApi,
): Promise<RoundState> {
  const startingPlayerId = chooseCycleStartingPlayerId(roundState);

  if (startingPlayerId === undefined) {
    return roundState;
  }

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
}

function findLoosingRoundTurns(roundState: RoundState): ValidTurn[] {
  const { cycles } = roundState;
  const lastCycle = last(cycles);
  return lastCycle && shouldIssuePenalties(lastCycle)
    ? lastCycle.highestTurns
    : [];
}

function findPlayersWithExceededPenaltySumThreshold(penalties: Penalty[]): PlayerId[] {
  const penaltiesByPlayerId = groupBy(penalty => penalty.playerId, penalties);
  return Object.keys(penaltiesByPlayerId).filter((playerId) => {
    const playerPenalties = penaltiesByPlayerId[playerId];
    const playerPenaltyCards = playerPenalties.map(penalty => penalty.card);
    return isPenaltySumThresholdExceeded(playerPenaltyCards);
  });
}

function finishRound(
  roundState: RoundState,
  dealer: Dealer,
  roomApi: RoomApi,
  previousRounds: Round[],
): Round {
  const winner = chooseRoundWinner(roundState, dealer.samplePlayerId);
  const loosingTurns = findLoosingRoundTurns(roundState);
  const currentRoundPenalties = createPenaltiesFromTurns(loosingTurns);
  const previousRoundPenalties = findPenaltiesFromRounds(previousRounds);
  const playerIdsWithExceededPenalty = findPlayersWithExceededPenaltySumThreshold([
    ...currentRoundPenalties, ...previousRoundPenalties,
  ]);
  const outPlayersWithExceededPenalty = playerIdsWithExceededPenalty.map(playerId => ({
    id: playerId, reason: 'penalty threshold exceeded',
  }));

  const updatedRoundState = {
    ...roundState,
    outPlayers: [
      ...roundState.outPlayers,
      ...outPlayersWithExceededPenalty,
    ],
  };

  roomApi.broadcastEndRound(currentRoundPenalties, roundState.outPlayers, winner);

  return {
    ...updatedRoundState,
    winner,
    penalties: currentRoundPenalties,
  };
}

export default async function (
  players: Player[],
  previousRounds: Round[],
  roomApi: RoomApi,
  dealer: Dealer,
): Promise<Round> {
  const playerIds = mapPlayersToPlayerIds(players);

  roomApi.broadcastStartRound(playerIds);

  const penaltyCards = findPenaltyCardsFromRounds(previousRounds);
  const roundCount = previousRounds.length;
  const cardCountToDeal = calculateCardCountToDeal(roundCount);
  const playerHands = dealer.createHandsForPlayerIds(playerIds, penaltyCards, cardCountToDeal);

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

  return delay(finishRound(finishedRoundState, dealer, roomApi, previousRounds), DELAY_AFTER_ROUND_IN_MILLIS);
}
