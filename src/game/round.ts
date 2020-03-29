import { chain, last, partial } from 'ramda';
import {
  Card, Penalty, PlayerId, ValidatedTurn,
} from 'agurk-shared';
import { Dealer } from '../types/dealer';
import { Player } from '../types/player';
import { GameState } from '../types/game';
import { RoomApi } from '../types/room';
import { Round, RoundState } from '../types/round';
import playCycle from './cycle';
import {
  calculateCardCountToDeal, chooseCycleStartingPlayerId, chooseRoundWinner, isRoundFinished,
} from './rules';
import {
  findActivePlayers, findPenaltiesFromRounds, mapPlayersToPlayerIds, rotatePlayersToPlayerId,
} from './common';

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

function findLoosingRoundTurns(roundState: RoundState): ValidatedTurn[] {
  const { cycles } = roundState;
  const lastCycle = last(cycles);
  return lastCycle && lastCycle.turns.length > 1
    ? lastCycle.highestTurns
    : [];
}

function finishRound(
  finishedRoundState: RoundState,
  dealer: Dealer,
  roomApi: RoomApi,
): Round {
  const winner = chooseRoundWinner(finishedRoundState, dealer.samplePlayerId);
  const loosingTurns = findLoosingRoundTurns(finishedRoundState);
  const penalties = createPenaltiesFromTurns(loosingTurns);

  roomApi.broadcastEndRound(penalties, finishedRoundState.outPlayers, winner);

  return {
    ...finishedRoundState,
    winner,
    penalties,
  };
}

export default async function (
  players: Player[],
  gameState: GameState,
  roomApi: RoomApi,
  dealer: Dealer,
): Promise<Round> {
  const playerIds = mapPlayersToPlayerIds(players);

  roomApi.broadcastStartRound(playerIds);

  const { rounds } = gameState;
  const penaltyCards = findPenaltyCardsFromRounds(rounds);
  const roundCount = rounds.length;
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

  return finishRound(finishedRoundState, dealer, roomApi);
}
