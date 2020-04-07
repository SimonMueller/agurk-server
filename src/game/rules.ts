import {
  ascend, chain, groupBy, head, identity, isEmpty, keys, last, map, partial, pickBy, sum, values,
} from 'ramda';
import {
  ValidatedTurn, OutPlayer, PlayerId, Penalty, Card, Rank, compareRanks as compareCardRanks, cardEquals,
} from 'agurk-shared';
import { Cycle, CycleState } from '../types/cycle';
import {
  CardCountToDeal, GameState, MaxPlayerCount, MinPlayerCount, PenaltySumThreshold, ValidCardCountRangeInclusive,
} from '../types/game';
import { Turn } from '../types/turn';
import { RoundState } from '../types/round';
import { findActivePlayerIds, findPenaltiesFromRounds } from './common';
import { SamplePlayerId } from '../types/dealer';

interface PenaltySumByPlayerId { [index: string]: number }

const mapCardRanks = (card: Card): Rank => card.rank;

const PENALTY_SUM_THRESHOLD: PenaltySumThreshold = 21;

const POSSIBLE_CARD_COUNTS: CardCountToDeal[] = [7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6];

const VALID_CARD_COUNT_RANGE: ValidCardCountRangeInclusive = [1, 7];

const MAX_PLAYER_COUNT: MaxPlayerCount = 7;

const MIN_PLAYER_COUNT: MinPlayerCount = 2;

export function isValidCardCount(playedCards: Card[]): boolean {
  return playedCards.length <= VALID_CARD_COUNT_RANGE[1]
    && playedCards.length >= VALID_CARD_COUNT_RANGE[0];
}

export function isValidPlayerCount(playerCount: number): boolean {
  return playerCount >= MIN_PLAYER_COUNT && playerCount <= MAX_PLAYER_COUNT;
}

export function calculateCardCountToDeal(roundsPlayed: number): CardCountToDeal {
  const index = roundsPlayed % POSSIBLE_CARD_COUNTS.length;
  return POSSIBLE_CARD_COUNTS[index];
}

export function isPenaltySumThresholdExceeded(penaltyCards: Card[]): boolean {
  const penaltyCardSum = penaltyCards.reduce((acc, card) => acc + card.rank, 0);
  return penaltyCardSum > PENALTY_SUM_THRESHOLD;
}

function isMatchingCardRanks(playedCards: Card[]): boolean {
  return playedCards.every(card => compareCardRanks(card, playedCards[0]) === 0);
}

function isMatchingCardRanksIfFirstTurn(turnCount: number, playedCards: Card[]): boolean {
  return turnCount !== 0
    ? true
    : isMatchingCardRanks(playedCards);
}

function isMatchingCycleCardCount(
  turnCount: number,
  previousTurnCardCount: number,
  playedCards: Card[],
): boolean {
  return turnCount === 0
    ? true
    : previousTurnCardCount === playedCards.length;
}

function isPlayedCardsNotEmpty(playedCards: Card[]): boolean {
  return playedCards.length !== 0;
}

function isEveryCardInPlayerHand(availableCards: Card[], playedCards: Card[]): boolean {
  return playedCards.every(card => availableCards.find(partial(cardEquals, [card])));
}

function isEveryCardRankHigherOrEqualThanCurrentMax(cyclePlayedCards: Card[], playedCards: Card[]): boolean {
  const cyclePlayedCardRanks = cyclePlayedCards.map(mapCardRanks);
  const playedCardRanks = playedCards.map(mapCardRanks);
  return playedCardRanks.every(rank => rank >= Math.max(...cyclePlayedCardRanks));
}

function isEveryCardOfLowestRank(availableCards: Card[], playedCards: Card[]): boolean {
  const sortedAvailableCardRanks = [...availableCards].sort(compareCardRanks).map(mapCardRanks);
  const sortedPlayedCardRanks = [...playedCards].sort(compareCardRanks).map(mapCardRanks);
  return sortedPlayedCardRanks.every((rank, index) => rank === sortedAvailableCardRanks[index]);
}

function isEveryCardOfValidRank(
  cyclePlayedCards: Card[],
  availableCards: Card[],
  playedCards: Card[],
): boolean {
  return isEveryCardRankHigherOrEqualThanCurrentMax(cyclePlayedCards, playedCards)
    || isEveryCardOfLowestRank(availableCards, playedCards);
}

function isLastTurn(availableCards: Card[], playedCards: Card[]): boolean {
  return availableCards.length - playedCards.length === 0;
}

function isLastTurnSingleCard(availableCards: Card[], playedCards: Card[]): boolean {
  return isLastTurn(availableCards, playedCards)
    ? playedCards.length === 1
    : true;
}

function isMatchingEveryTurnRule(
  turnCount: number,
  previousTurnCardCount: number,
  availableCards: Card[],
  playedCards: Card[],
  cyclePlayedCards: Card[],
): boolean {
  return [
    isValidCardCount(playedCards),
    isPlayedCardsNotEmpty(playedCards),
    isMatchingCycleCardCount(turnCount, previousTurnCardCount, playedCards),
    isEveryCardInPlayerHand(availableCards, playedCards),
    isMatchingCardRanksIfFirstTurn(turnCount, playedCards),
    isEveryCardOfValidRank(cyclePlayedCards, availableCards, playedCards),
    isLastTurnSingleCard(availableCards, playedCards),
  ].every(value => value);
}

const mapTurnCards = (turn: ValidatedTurn): Card[] => turn.cards;

export function validateTurn(turnToValidate: Turn, cycleState: CycleState): ValidatedTurn {
  const previousValidTurns = cycleState.turns.filter(turn => turn.valid);
  const availableCards = cycleState.hands[turnToValidate.playerId];
  const playedCards = turnToValidate.cards;
  const turnCount = previousValidTurns.length;
  const firstTurn = head(previousValidTurns);
  const previousTurnCardCount = firstTurn ? firstTurn.cards.length : 0;
  const cyclePlayedCards = chain(mapTurnCards, previousValidTurns);

  const valid = isMatchingEveryTurnRule(
    turnCount,
    previousTurnCardCount,
    availableCards,
    playedCards,
    cyclePlayedCards,
  );
  return valid
    ? { ...turnToValidate, valid }
    : { ...turnToValidate, valid, invalidReason: 'not following the game rules' };
}

function isSingleActivePlayer(playerIds: PlayerId[], outPlayers: OutPlayer[]): boolean {
  const activePlayerIds = findActivePlayerIds(playerIds, outPlayers);
  return activePlayerIds.length === 1;
}

function allPlayersOut(playerIds: PlayerId[], outPlayers: OutPlayer[]): boolean {
  return isEmpty(findActivePlayerIds(playerIds, outPlayers));
}

function hasEveryPlayerOneCardInHand(playerIds: PlayerId[], lastCycle: Cycle): boolean {
  return playerIds.every((playerId) => {
    const { hands } = lastCycle;
    return hands[playerId].length === 1;
  });
}

function isRoundFinishedAfterCycle(lastCycle: Cycle): boolean {
  const { playerIds, outPlayers } = lastCycle;
  const everyPlayerHadOneCardInHand = hasEveryPlayerOneCardInHand(playerIds, lastCycle);
  return everyPlayerHadOneCardInHand
    || isSingleActivePlayer(playerIds, outPlayers)
    || allPlayersOut(playerIds, outPlayers);
}

export function isRoundFinished(roundState: RoundState): boolean {
  const lastCycle = last(roundState.cycles);
  return lastCycle
    ? isRoundFinishedAfterCycle(lastCycle)
    : false;
}

export function isGameFinished(gameState: GameState): boolean {
  const { outPlayers, playerIds } = gameState;
  return isSingleActivePlayer(playerIds, outPlayers)
    || allPlayersOut(playerIds, outPlayers);
}

export function chooseRoundStartingPlayerId(gameState: GameState): PlayerId | undefined {
  const { rounds, playerIds } = gameState;
  return isEmpty(rounds)
    ? head(playerIds)
    : last(rounds)?.winner;
}

function findPlayerIdOfMostRecentHighestTurn(cycles: Cycle[]): PlayerId | undefined {
  const mostRecentHighestTurn = last(cycles)?.highestTurns;
  return mostRecentHighestTurn === undefined
    ? undefined
    : last(mostRecentHighestTurn)?.playerId;
}

export function chooseCycleStartingPlayerId(roundState: RoundState): PlayerId | undefined {
  const { cycles } = roundState;
  const { playerIds } = roundState;
  return isEmpty(cycles)
    ? head(playerIds)
    : findPlayerIdOfMostRecentHighestTurn(cycles);
}

function calculatePenaltySum(penaltiesForPlayerId: Penalty[]): number {
  return sum(penaltiesForPlayerId.map(penalty => penalty.card.rank));
}

const byRankSumAscending = ascend(identity);

function choosePlayerIdWithMinPenaltySum(
  sample: SamplePlayerId,
  minPenaltySum: number,
  penaltySumByPlayerId: PenaltySumByPlayerId,
): PlayerId | undefined {
  const playerIdsWithMinPenalty = keys(pickBy(value => value === minPenaltySum, penaltySumByPlayerId));
  return sample(playerIdsWithMinPenalty);
}

function chooseByLowestPenaltySum(sample: SamplePlayerId, gameState: GameState): PlayerId | undefined {
  const penalties = findPenaltiesFromRounds(gameState.rounds);
  const penaltiesByPlayerId = groupBy((penalty: Penalty) => penalty.playerId, penalties);
  const penaltySumByPlayerId: PenaltySumByPlayerId = map(calculatePenaltySum, penaltiesByPlayerId);
  const penaltyRankSums = values(penaltySumByPlayerId);
  const penaltySumsSortedAsc = penaltyRankSums.sort(byRankSumAscending);
  const minPenaltySum = head(penaltySumsSortedAsc);
  return minPenaltySum === undefined
    ? undefined
    : choosePlayerIdWithMinPenaltySum(sample, minPenaltySum, penaltySumByPlayerId);
}

function chooseSingleActivePlayer(playerIds: PlayerId[], outPlayers: OutPlayer[]): PlayerId | undefined {
  return isSingleActivePlayer(playerIds, outPlayers)
    ? head(findActivePlayerIds(playerIds, outPlayers))
    : undefined;
}

// TODO: test for both players out because of same card but one with lower penalty
export function chooseGameWinner(sample: SamplePlayerId, gameState: GameState): PlayerId | undefined {
  const { outPlayers } = gameState;
  const { playerIds } = gameState;

  return allPlayersOut(playerIds, outPlayers)
    ? chooseByLowestPenaltySum(sample, gameState)
    : chooseSingleActivePlayer(playerIds, outPlayers);
}

export function chooseRoundWinner(roundState: RoundState, sample: SamplePlayerId): PlayerId | undefined {
  const { cycles } = roundState;
  const lastCycle = last(cycles);
  const winningTurns = lastCycle?.lowestTurns;
  const winners = winningTurns?.map(turn => turn.playerId);
  return winners !== undefined && winners.length > 0
    ? sample(winners)
    : undefined;
}
