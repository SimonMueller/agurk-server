import { Card, PlayerId, ValidatedTurn } from 'agurk-shared';
import { Result } from '../types/result';
import { RoomApi } from '../types/room';
import { Player } from '../types/player';
import { CycleState } from '../types/cycle';
import logger from '../logger';
import { validateTurn } from './rules';
import { ERROR_RESULT_KIND, SUCCESS_RESULT_KIND } from './common';

async function requestCards(player: Player): Promise<Result<Error, Card[]>> {
  if (player.api.isConnected()) {
    try {
      const cards = await player.api.requestCards();
      return { kind: SUCCESS_RESULT_KIND, data: cards };
    } catch (error) {
      logger.error(error);
      return { kind: ERROR_RESULT_KIND, error };
    }
  }

  return {
    kind: ERROR_RESULT_KIND,
    error: Error('cannot request cards from disconnected player'),
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

function createInvalidTurnWithNoCardsPlayed(playerId: string): ValidatedTurn {
  return {
    playerId, cards: [], valid: false, invalidReason: 'problem requesting cards from player',
  };
}

export default async function (
  player: Player,
  cycleState: CycleState,
  roomApi: RoomApi,
): Promise<ValidatedTurn> {
  const { id: playerId } = player;

  roomApi.broadcastStartPlayerTurn(playerId);
  player.api.availableCardsInHand(cycleState.hands[playerId]);

  const playedCardsResult = await requestCards(player);

  const validatedTurn = playedCardsResult.kind === ERROR_RESULT_KIND
    ? createInvalidTurnWithNoCardsPlayed(playerId)
    : validatePlayedCardsInTurn(playedCardsResult.data, playerId, cycleState);

  roomApi.broadcastPlayerTurn(validatedTurn);

  return validatedTurn;
}
