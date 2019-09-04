import {
  partial, isEmpty, chain, last, head, groupBy, sum, map, pickBy, keys, values, ascend, identity,
} from 'ramda';
import { ValidatedTurn } from '../../shared/types/turn';
import { Cycle, CycleState } from '../types/cycle';
import {
  GameState, CardCountToDeal, PenaltySumThreshold, MaxPlayerCount, MinPlayerCount,
} from '../types/game';
import { OutPlayer, PlayerId } from '../../shared/types/player';
import { Penalty } from '../../shared/types/penalty';
import { Turn } from '../types/turn';
import { firstOrThrow, lastOrThrow } from '../util';
import { RoundState } from '../types/round';
import {
  equals as cardEquals, compareRanks as compareCardRanks,
} from '../../shared/game/card';
import { findActivePlayerIds, findPenaltiesFromRounds } from './common';
import { SamplePlayerId } from '../types/dealer';
import { Card, Rank } from '../../shared/types/card';

interface PenaltySumByPlayerId { [index: string]: number }

const mapCardRanks = (card: Card): Rank => card.rank;

const PENALTY_SUM_THRESHOLD: PenaltySumThreshold = 21;

const POSSIBLE_CARD_COUNTS: CardCountToDeal[] = [7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6];

const MAX_PLAYER_COUNT: MaxPlayerCount = 7;

const MIN_PLAYER_COUNT: MinPlayerCount = 2;

export const isValidPlayerCount = (
  playerCount: number,
): boolean => playerCount >= MIN_PLAYER_COUNT && playerCount <= MAX_PLAYER_COUNT;

export const calculateCardCountToDeal = (roundsPlayed: number): CardCountToDeal => {
  const index = roundsPlayed % POSSIBLE_CARD_COUNTS.length;
  return POSSIBLE_CARD_COUNTS[index];
};

export const isPenaltySumThresholdExceeded = (penaltyCards: Card[]): boolean => {
  const penaltyCardSum = penaltyCards.reduce((acc, card) => acc + card.rank, 0);
  return penaltyCardSum > PENALTY_SUM_THRESHOLD;
};

const isMatchingCardRanks = (
  playedCards: Card[],
): boolean => playedCards.every(card => compareCardRanks(card, playedCards[0]) === 0);

const isMatchingCardRanksIfFirstTurn = (
  turnCount: number,
  playedCards: Card[],
): boolean => (turnCount !== 0 ? true : isMatchingCardRanks(playedCards));

const isMatchingCycleCardCount = (
  turnCount: number,
  previousTurnCardCount: number,
  playedCards: Card[],
): boolean => (turnCount === 0 ? true : previousTurnCardCount === playedCards.length);

const isPlayedCardsNotEmpty = (playedCards: Card[]): boolean => playedCards.length !== 0;

const isEveryCardInPlayerHand = (
  availableCards: Card[],
  playedCards: Card[],
): boolean => playedCards.every(card => availableCards.find(partial(cardEquals, [card])));

const isEveryCardRankHigherOrEqualThanCurrentMax = (
  cyclePlayedCards: Card[],
  playedCards: Card[],
): boolean => {
  const cyclePlayedCardRanks = cyclePlayedCards.map(mapCardRanks);
  const playedCardRanks = playedCards.map(mapCardRanks);
  return playedCardRanks.every(rank => rank >= Math.max(...cyclePlayedCardRanks));
};

const isEveryCardOfLowestRank = (
  availableCards: Card[],
  playedCards: Card[],
): boolean => {
  const sortedAvailableCardRanks = [...availableCards].sort(compareCardRanks).map(mapCardRanks);
  const sortedPlayedCardRanks = [...playedCards].sort(compareCardRanks).map(mapCardRanks);
  return sortedPlayedCardRanks.every((rank, index) => rank === sortedAvailableCardRanks[index]);
};

const isEveryCardOfValidRank = (
  cyclePlayedCards: Card[],
  availableCards: Card[],
  playedCards: Card[],
): boolean => isEveryCardRankHigherOrEqualThanCurrentMax(cyclePlayedCards, playedCards)
  || isEveryCardOfLowestRank(availableCards, playedCards);

const isTrue = (value: boolean): boolean => value;

const isLastTurn = (
  availableCards: Card[],
  playedCards: Card[],
): boolean => availableCards.length - playedCards.length === 0;

const isLastTurnSingleCard = (
  availableCards: Card[],
  playedCards: Card[],
): boolean => (isLastTurn(availableCards, playedCards) ? playedCards.length === 1 : true);

const isMatchingEveryTurnRule = (
  turnCount: number,
  previousTurnCardCount: number,
  availableCards: Card[],
  playedCards: Card[],
  cyclePlayedCards: Card[],
): boolean => [
  isPlayedCardsNotEmpty(playedCards),
  isMatchingCycleCardCount(turnCount, previousTurnCardCount, playedCards),
  isEveryCardInPlayerHand(availableCards, playedCards),
  isMatchingCardRanksIfFirstTurn(turnCount, playedCards),
  isEveryCardOfValidRank(cyclePlayedCards, availableCards, playedCards),
  isLastTurnSingleCard(availableCards, playedCards),
].every(isTrue);

const mapTurnCards = (turn: ValidatedTurn): Card[] => turn.cards;

export const validateTurn = (
  turn: Turn,
  cycleState: CycleState,
): ValidatedTurn => {
  const previousTurns = cycleState.turns;
  const availableCards = cycleState.hands[turn.playerId];
  const playedCards = turn.cards;
  const turnCount = previousTurns.length;
  const firstTurn = head(previousTurns);
  const previousTurnCardCount = firstTurn ? firstTurn.cards.length : 0;
  const cyclePlayedCards = chain(mapTurnCards, previousTurns);

  const valid = isMatchingEveryTurnRule(
    turnCount,
    previousTurnCardCount,
    availableCards,
    playedCards,
    cyclePlayedCards,
  );
  return { ...turn, valid };
};

const isSingleActivePlayer = (
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
): boolean => {
  const activePlayerIds = findActivePlayerIds(playerIds, outPlayers);
  return activePlayerIds.length === 1;
};

const allPlayersOut = (
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
): boolean => isEmpty(findActivePlayerIds(playerIds, outPlayers));

const hasEveryPlayerOneCardInHand = (
  playerIds: PlayerId[],
  lastCycle: Cycle,
): boolean => playerIds.every((playerId) => {
  const { hands } = lastCycle;
  return hands[playerId].length === 1;
});

const isRoundFinishedAfterCycle = (lastCycle: Cycle): boolean => {
  const { playerIds, outPlayers } = lastCycle;
  const everyPlayerHadOneCardInHand = hasEveryPlayerOneCardInHand(playerIds, lastCycle);
  return everyPlayerHadOneCardInHand
    || isSingleActivePlayer(playerIds, outPlayers)
    || allPlayersOut(playerIds, outPlayers);
};

export const isRoundFinished = (roundState: RoundState): boolean => {
  const lastCycle = last(roundState.cycles);
  return lastCycle
    ? isRoundFinishedAfterCycle(lastCycle)
    : false;
};

export const isGameFinished = (gameState: GameState): boolean => {
  const { outPlayers, playerIds } = gameState;
  return isSingleActivePlayer(playerIds, outPlayers)
    || allPlayersOut(playerIds, outPlayers);
};

export const chooseRoundStartingPlayerId = (gameState: GameState): PlayerId => {
  const { rounds, playerIds } = gameState;
  return (isEmpty(rounds)
    ? firstOrThrow(playerIds)
    : lastOrThrow(rounds).winner);
};

export const chooseCycleStartingPlayerId = (roundState: RoundState): PlayerId => {
  const { cycles } = roundState;
  const { playerIds } = roundState;
  return (isEmpty(cycles)
    ? firstOrThrow(playerIds)
    : lastOrThrow(lastOrThrow(cycles).highestTurns).playerId);
};

const calculatePenaltySum = (
  penaltiesForPlayerId: Penalty[],
): number => sum(penaltiesForPlayerId.map(penalty => penalty.card.rank));

const byRankSumAscending = ascend(identity);

const choosePlayerIdWithMinPenaltySum = (
  sample: SamplePlayerId,
  minPenaltySum: number,
  penaltySumByPlayerId: PenaltySumByPlayerId,
): PlayerId => {
  const playerIdsWithMinPenalty = keys(pickBy(value => value === minPenaltySum, penaltySumByPlayerId));
  return sample(playerIdsWithMinPenalty);
};

const chooseByLowestPenaltySum = (sample: SamplePlayerId, gameState: GameState): PlayerId | undefined => {
  const penalties = findPenaltiesFromRounds(gameState.rounds);
  const penaltiesByPlayerId = groupBy((penalty: Penalty) => penalty.playerId, penalties);
  const penaltySumByPlayerId: PenaltySumByPlayerId = map(calculatePenaltySum, penaltiesByPlayerId);
  const penaltyRankSums = values(penaltySumByPlayerId);
  const penaltySumsSortedAsc = penaltyRankSums.sort(byRankSumAscending);
  const minPenaltySum = head(penaltySumsSortedAsc);
  return minPenaltySum === undefined
    ? undefined
    : choosePlayerIdWithMinPenaltySum(sample, minPenaltySum, penaltySumByPlayerId);
};

const chooseSingleActivePlayer = (
  playerIds: PlayerId[],
  outPlayers: OutPlayer[],
): PlayerId | undefined => (isSingleActivePlayer(playerIds, outPlayers)
  ? head(findActivePlayerIds(playerIds, outPlayers))
  : undefined);

// TODO: test for both players out because of same card but one with lower penalty
export const chooseGameWinner = (
  sample: SamplePlayerId,
  gameState: GameState,
): PlayerId | undefined => {
  const { outPlayers } = gameState;
  const { playerIds } = gameState;

  return allPlayersOut(playerIds, outPlayers)
    ? chooseByLowestPenaltySum(sample, gameState)
    : chooseSingleActivePlayer(playerIds, outPlayers);
};

export const chooseRoundWinner = (
  roundState: RoundState,
  sample: SamplePlayerId,
): PlayerId => {
  const { cycles } = roundState;
  const lastCycle = lastOrThrow(cycles);
  const winningTurns = lastCycle.lowestTurns;
  const winners = winningTurns.map(turn => turn.playerId);
  return sample(winners);
};
