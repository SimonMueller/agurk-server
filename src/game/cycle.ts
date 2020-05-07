import config from 'config';
import {
  ascend, chain, descend, differenceWith, head, identity, sort,
} from 'ramda';
import {
  Card, cardEquals, InvalidTurn, OutPlayer, PlayerId, Rank, ValidatedTurn, ValidTurn,
} from 'agurk-shared';
import { Cycle, CycleState } from '../types/cycle';
import { Hand, HandsByPlayerId } from '../types/hand';
import { Player } from '../types/player';
import { RoomApi } from '../types/room';
import { RoundState } from '../types/round';
import { mapPlayersToPlayerIds } from './common';
import playTurn from './turn';
import { delay } from '../util';

const TURN_RETRIES_ALLOWED: number = config.get('server.requestRetriesAllowed');
const DELAY_AFTER_CYCLE_IN_MILLIS: number = config.get('server.delayAfterCycleInMillis');

const mapCardRank = (card: Card): Rank => card.rank;

const mapTurnCards = (turn: ValidatedTurn): Card[] => turn.cards;

function filterTurnsIncludingCardRank(turns: ValidTurn[], cardRank: Rank): ValidTurn[] {
  return turns.filter((turn) => {
    const { cards } = turn;
    const cardRanks = cards.map(mapCardRank);
    return cardRanks.includes(cardRank);
  });
}

const compareCardRankAsc = ascend(identity);

const compareCardRankDesc = descend(identity);

function findRanksPlayedInTurns(turns: ValidTurn[]): Rank[] {
  const cardsPlayedInTurns = chain(mapTurnCards, turns);
  return cardsPlayedInTurns.map(mapCardRank);
}

function findFirstRankAfterSortBy(
  by: (a: Rank, b: Rank) => number,
  ranksPlayedInTurns: Rank[],
): Rank | undefined {
  return head(sort(by, ranksPlayedInTurns));
}

function findLowestRankTurns(turns: ValidTurn[]): ValidTurn[] {
  const ranksPlayedInTurns: Rank[] = findRanksPlayedInTurns(turns);
  const lowestRank = findFirstRankAfterSortBy(compareCardRankAsc, ranksPlayedInTurns);
  return lowestRank
    ? filterTurnsIncludingCardRank(turns, lowestRank)
    : [];
}

const findHighestRankTurns = (turns: ValidTurn[]): ValidTurn[] => {
  const ranksPlayedInTurns: Rank[] = findRanksPlayedInTurns(turns);
  const highestRank = findFirstRankAfterSortBy(compareCardRankDesc, ranksPlayedInTurns);
  return highestRank
    ? filterTurnsIncludingCardRank(turns, highestRank)
    : [];
};

function filterAvailableCardsFromPlayerHand(hand: Hand, playerId: PlayerId, turns: ValidTurn[]): Card[] {
  const playerTurns = turns.filter(turn => turn.playerId === playerId);
  const cyclePlayedCards = chain(mapTurnCards, playerTurns);
  return differenceWith(cardEquals, hand, cyclePlayedCards);
}

function filterAvailableCardsFromPlayerHands(
  playerIds: PlayerId[],
  hands: HandsByPlayerId,
  turns: ValidTurn[],
): HandsByPlayerId {
  return playerIds.reduce((cardsInHandAcc, playerId) => {
    const cards = filterAvailableCardsFromPlayerHand(hands[playerId], playerId, turns);
    return {
      ...cardsInHandAcc,
      [playerId]: cards,
    };
  }, {});
}

function createOutPlayerFrom(invalidTurn: InvalidTurn): OutPlayer {
  return {
    id: invalidTurn.playerId,
    reason: invalidTurn.invalidReason,
  };
}

function addOutPlayerAfterInvalidTurn(
  previousCycleState: CycleState,
  invalidTurn: InvalidTurn,
  roomApi: RoomApi,
): CycleState {
  const outPlayer = createOutPlayerFrom(invalidTurn);

  roomApi.broadcastOutPlayerAfterTurn(outPlayer);

  return {
    ...previousCycleState,
    outPlayers: [
      ...previousCycleState.outPlayers,
      outPlayer,
    ],
  };
}

function addTurnToCycle(previousCycleState: CycleState, turn: ValidatedTurn): CycleState {
  return {
    ...previousCycleState,
    turns: [
      ...previousCycleState.turns,
      turn,
    ],
  };
}

function finishPlayerTurn(turn: ValidatedTurn, cycleState: CycleState, roomApi: RoomApi): CycleState {
  return turn.valid
    ? cycleState
    : addOutPlayerAfterInvalidTurn(cycleState, turn, roomApi);
}

async function playTurnWithRetry(
  player: Player,
  cycleState: CycleState,
  roomApi: RoomApi,
  retriesLeft: number,
): Promise<CycleState> {
  const turn = await playTurn(player, cycleState, roomApi, retriesLeft);
  const updatedCycleState = addTurnToCycle(cycleState, turn);
  const shouldRetryTurn = !turn.valid && retriesLeft !== 0 && player.api.isConnected();
  return shouldRetryTurn
    ? playTurnWithRetry(player, updatedCycleState, roomApi, retriesLeft - 1)
    : finishPlayerTurn(turn, updatedCycleState, roomApi);
}

async function getCycleStateAfterTurn(
  previousCycleStatePromise: Promise<CycleState>,
  player: Player,
  roomApi: RoomApi,
): Promise<CycleState> {
  const previousCycleState = await previousCycleStatePromise;
  return playTurnWithRetry(player, previousCycleState, roomApi, TURN_RETRIES_ALLOWED);
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
  hands: HandsByPlayerId,
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

export default async function (
  players: Player[],
  roundState: RoundState,
  roomApi: RoomApi,
): Promise<Cycle> {
  const { initialHands, cycles } = roundState;
  const playerIds = mapPlayersToPlayerIds(players);
  const validRoundTurns = chain(cycle => cycle.turns, cycles).filter((turn): turn is ValidTurn => turn.valid);
  const hands = filterAvailableCardsFromPlayerHands(playerIds, initialHands, validRoundTurns);
  const isLastOfRound = Object.values(hands).every(hand => hand.length === 1);

  roomApi.broadcastStartCycle(playerIds, isLastOfRound);

  const cycleState = await playTurnsInCycle(players, roomApi, hands, playerIds);

  const { turns } = cycleState;
  const validCycleTurns = turns.filter((turn): turn is ValidTurn => turn.valid);
  const highestTurns = findHighestRankTurns(validCycleTurns);
  const lowestTurns = findLowestRankTurns(validCycleTurns);
  const highestTurnPlayers = highestTurns.map(turn => turn.playerId);

  roomApi.broadcastEndCycle(cycleState.outPlayers, highestTurnPlayers, DELAY_AFTER_CYCLE_IN_MILLIS);

  const cycle = { ...cycleState, highestTurns, lowestTurns };
  return isLastOfRound
    ? cycle
    : delay(cycle, DELAY_AFTER_CYCLE_IN_MILLIS);
}
