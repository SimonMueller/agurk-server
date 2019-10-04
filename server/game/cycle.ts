import config from 'config';
import {
  ascend, chain, descend, differenceWith, head, identity, sort,
} from 'ramda';
import { equals as cardEquals } from '../../shared/game/card';
import { Card, Rank } from '../../shared/types/card';
import { PlayerId } from '../../shared/types/player';
import { ValidatedTurn } from '../../shared/types/turn';
import logger from '../logger';
import { Cycle, CycleState } from '../types/cycle';
import { Hand, PlayerHands } from '../types/hand';
import { Player } from '../types/player';
import { RoomApi } from '../types/room';
import { RoundState } from '../types/round';
import { TurnError, TurnResult } from '../types/turn';
import { ERROR_RESULT_KIND, mapPlayersToPlayerIds } from './common';
import playTurn from './turn';

const TURN_RETRIES_ALLOWED: number = config.get('server.requestRetriesAllowed');

const mapCardRank = (card: Card): Rank => card.rank;

const mapTurnCards = (turn: ValidatedTurn): Card[] => turn.cards;

function filterTurnsIncludingCardRank(turns: ValidatedTurn[], cardRank: Rank): ValidatedTurn[] {
  return turns.filter((turn) => {
    const { cards } = turn;
    const cardRanks = cards.map(mapCardRank);
    return cardRanks.includes(cardRank);
  });
}

const compareCardRankAsc = ascend(identity);

const compareCardRankDesc = descend(identity);

function findRanksPlayedInTurns(turns: ValidatedTurn[]): Rank[] {
  const cardsPlayedInTurns = chain(mapTurnCards, turns);
  return cardsPlayedInTurns.map(mapCardRank);
}

function findFirstRankAfterSortBy(
  by: (a: Rank, b: Rank) => number,
  ranksPlayedInTurns: Rank[],
): Rank | undefined {
  return head(sort(by, ranksPlayedInTurns));
}

function findLowestRankTurns(turns: ValidatedTurn[]): ValidatedTurn[] {
  const ranksPlayedInTurns: Rank[] = findRanksPlayedInTurns(turns);
  const lowestRank = findFirstRankAfterSortBy(compareCardRankAsc, ranksPlayedInTurns);
  return lowestRank
    ? filterTurnsIncludingCardRank(turns, lowestRank)
    : [];
}

const findHighestRankTurns = (turns: ValidatedTurn[]): ValidatedTurn[] => {
  const ranksPlayedInTurns: Rank[] = findRanksPlayedInTurns(turns);
  const highestRank = findFirstRankAfterSortBy(compareCardRankDesc, ranksPlayedInTurns);
  return highestRank
    ? filterTurnsIncludingCardRank(turns, highestRank)
    : [];
};

function filterUnplayedCardsFromHand(turns: ValidatedTurn[], hand: Hand): Card[] {
  const cyclePlayedCards = chain(mapTurnCards, turns);
  return differenceWith(cardEquals, hand, cyclePlayedCards);
}

function filterAvailableCardsFromPlayerHands(
  playerIds: PlayerId[],
  hands: PlayerHands,
  turns: ValidatedTurn[],
): PlayerHands {
  return playerIds.reduce((cardsInHandAcc, playerId) => {
    const hand = hands[playerId];
    const playerTurns = turns.filter(turn => turn.playerId === playerId);
    const cards = filterUnplayedCardsFromHand(playerTurns, hand);
    return {
      ...cardsInHandAcc,
      [playerId]: cards,
    };
  }, {});
}

function shouldRetryTurn(turnResult: TurnResult, retriesLeft: number): boolean {
  return turnResult.kind === ERROR_RESULT_KIND
    && retriesLeft !== 0;
}

async function playTurnWithRetry(
  player: Player,
  previousCycleState: CycleState,
  roomApi: RoomApi,
  retriesLeft: number,
): Promise<TurnResult> {
  const turnResult = await playTurn(player, previousCycleState, roomApi);

  logger.info(`trying to play turn. ${retriesLeft} retries left...`);

  return shouldRetryTurn(turnResult, retriesLeft)
    ? playTurnWithRetry(player, previousCycleState, roomApi, retriesLeft - 1)
    : turnResult;
}

function addErrorTurnPlayerIdToOutPlayers(previousCycleState: CycleState, errorTurn: TurnError): CycleState {
  return {
    ...previousCycleState,
    outPlayers: [
      ...previousCycleState.outPlayers,
      {
        id: errorTurn.playerId,
        reason: errorTurn.message,
      },
    ],
  };
}

function addValidTurnToCycleTurns(previousCycleState: CycleState, turn: ValidatedTurn): CycleState {
  return {
    ...previousCycleState,
    turns: [
      ...previousCycleState.turns,
      turn,
    ],
  };
}

function buildNewCycleState(turnResult: TurnResult, previousCycleState: CycleState): CycleState {
  return turnResult.kind === ERROR_RESULT_KIND
    ? addErrorTurnPlayerIdToOutPlayers(previousCycleState, turnResult.error)
    : addValidTurnToCycleTurns(previousCycleState, turnResult.data);
}

async function getCycleStateAfterTurn(
  previousCycleStatePromise: Promise<CycleState>,
  player: Player,
  roomApi: RoomApi,
): Promise<CycleState> {
  const previousCycleState = await previousCycleStatePromise;
  const turnResult = await playTurnWithRetry(player, previousCycleState, roomApi, TURN_RETRIES_ALLOWED);

  return buildNewCycleState(turnResult, previousCycleState);
}

function turnsToCycleState(roomApi: RoomApi) {
  return (
    previousCycleStatePromise: Promise<CycleState>,
    player: Player,
  ): Promise<CycleState> => getCycleStateAfterTurn(previousCycleStatePromise, player, roomApi);
}

async function playTurnsInCycle(
  players: Player[],
  roomApi: RoomApi,
  hands: PlayerHands,
  playerIds: PlayerId[],
): Promise<CycleState> {
  return players.reduce(turnsToCycleState(roomApi),
    Promise.resolve({
      turns: [],
      hands,
      outPlayers: [],
      playerIds,
    }));
}

function broadcastStartCycle(roomApi: RoomApi, playerIds: PlayerId[]): void {
  roomApi.broadcastStartCycle();
  roomApi.broadcastPlayers(playerIds);
  roomApi.broadcastPlayerOrder(playerIds);
}

function broadcastFinishedCycle(roomApi: RoomApi, cycleState: CycleState): void {
  roomApi.broadcastEndCycle();
  roomApi.broadcastOutPlayers(cycleState.outPlayers);
}

export default async function (
  players: Player[],
  roundState: RoundState,
  roomApi: RoomApi,
): Promise<Cycle> {
  const { initialHands, cycles } = roundState;
  const playerIds = mapPlayersToPlayerIds(players);

  broadcastStartCycle(roomApi, playerIds);

  const roundTurns = chain(cycle => cycle.turns, cycles);
  const hands = filterAvailableCardsFromPlayerHands(playerIds, initialHands, roundTurns);

  const cycleState = await playTurnsInCycle(players, roomApi, hands, playerIds);

  const { turns } = cycleState;
  const highestTurns = findHighestRankTurns(turns);
  const lowestTurns = findLowestRankTurns(turns);

  broadcastFinishedCycle(roomApi, cycleState);

  return {
    ...cycleState,
    highestTurns,
    lowestTurns,
  };
}
