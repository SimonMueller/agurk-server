import {
  Card, InvalidTurn, PlayerId, ValidatedTurn,
} from 'agurk-shared';
import { Result } from '../types/result';
import { RoomApi } from '../types/room';
import { Player } from '../types/player';
import { CycleState } from '../types/cycle';
import logger from '../logger';
import { validateTurn } from './rules';
import { ERROR_RESULT_KIND, SUCCESS_RESULT_KIND } from './common';

async function requestCards(player: Player, retriesLeft: number): Promise<Result<string, Card[]>> {
  if (player.api.isConnected()) {
    try {
      const cards = await player.api.requestCards(retriesLeft);
      return { kind: SUCCESS_RESULT_KIND, data: cards };
    } catch (error) {
      logger.error(error.message);
      return { kind: ERROR_RESULT_KIND, error };
    }
  }

  const error = 'cannot request cards from disconnected player';
  logger.error(error, { playerId: player.id });
  return {
    kind: ERROR_RESULT_KIND,
    error,
  };
}

function validatePlayedCardsInTurn(
  playedCards: Card[],
  playerId: PlayerId,
  cycleState: CycleState,
): ValidatedTurn {
  const turn = { cards: playedCards, playerId };
  return validateTurn(turn, cycleState);
}

function createInvalidTurnWithNoCardsPlayed(playerId: string): InvalidTurn {
  return {
    playerId, cards: [], valid: false, invalidReason: 'no cards played',
  };
}

export default async function play(
  player: Player,
  cycleState: CycleState,
  roomApi: RoomApi,
  retriesLeft: number,
): Promise<ValidatedTurn> {
  const { id: playerId } = player;

  roomApi.broadcastStartPlayerTurn(playerId);

  const playedCardsResult = await requestCards(player, retriesLeft);

  const validatedTurn = playedCardsResult.kind === ERROR_RESULT_KIND
    ? createInvalidTurnWithNoCardsPlayed(playerId)
    : validatePlayedCardsInTurn(playedCardsResult.data, playerId, cycleState);

  roomApi.broadcastPlayerTurn(validatedTurn);

  return validatedTurn;
}
