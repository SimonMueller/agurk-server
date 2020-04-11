import config from 'config';
import {
  ascend, chain, descend, differenceWith, head, identity, sort,
} from 'ramda';
import {
  PlayerId, Card, Rank, ValidatedTurn, cardEquals, InvalidTurn, ValidTurn,
} from 'agurk-shared';
import { Cycle, CycleState } from '../types/cycle';
import { Hand, PlayerHands } from '../types/hand';
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

function filterUnplayedCardsFromHand(turns: ValidTurn[], hand: Hand): Card[] {
  const cyclePlayedCards = chain(mapTurnCards, turns);
  return differenceWith(cardEquals, hand, cyclePlayedCards);
}

function filterAvailableCardsFromPlayerHands(
  playerIds: PlayerId[],
  hands: PlayerHands,
  turns: ValidTurn[],
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

function addErrorTurnPlayerIdToOutPlayers(previousCycleState: CycleState, invalidTurn: InvalidTurn): CycleState {
  return {
    ...previousCycleState,
    outPlayers: [
      ...previousCycleState.outPlayers,
      {
        id: invalidTurn.playerId,
        reason: invalidTurn.invalidReason,
      },
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

function finishPlayerTurn(turn: ValidatedTurn, cycleState: CycleState): CycleState {
  return turn.valid
    ? cycleState
    : addErrorTurnPlayerIdToOutPlayers(cycleState, turn);
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
    : finishPlayerTurn(turn, updatedCycleState);
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

export default async function (
  players: Player[],
  roundState: RoundState,
  roomApi: RoomApi,
): Promise<Cycle> {
  const { initialHands, cycles } = roundState;
  const playerIds = mapPlayersToPlayerIds(players);

  roomApi.broadcastStartCycle(playerIds);

  const validRoundTurns = chain(cycle => cycle.turns, cycles).filter((turn): turn is ValidTurn => turn.valid);
  const hands = filterAvailableCardsFromPlayerHands(playerIds, initialHands, validRoundTurns);

  const cycleState = await playTurnsInCycle(players, roomApi, hands, playerIds);

  const { turns } = cycleState;
  const validCycleTurns = turns.filter((turn): turn is ValidTurn => turn.valid);
  const highestTurns = findHighestRankTurns(validCycleTurns);
  const lowestTurns = findLowestRankTurns(validCycleTurns);
  const highestTurnPlayers = highestTurns.map(turn => turn.playerId);

  roomApi.broadcastEndCycle(cycleState.outPlayers, highestTurnPlayers, DELAY_AFTER_CYCLE_IN_MILLIS);

  return delay({
    ...cycleState,
    highestTurns,
    lowestTurns,
  }, DELAY_AFTER_CYCLE_IN_MILLIS);
}
