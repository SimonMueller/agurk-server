import { Card, PlayerId, ValidatedTurn } from 'agurk-shared';
import { Result } from '../types/result';
import { RoomApi } from '../types/room';
import { Player } from '../types/player';
import { CycleState } from '../types/cycle';
import logger from '../logger';
import { TurnResult } from '../types/turn';
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

function buildPlayerTurnError(playerId: PlayerId, message: string): TurnResult {
  return {
    kind: ERROR_RESULT_KIND,
    error: {
      playerId,
      message,
    },
  };
}

function buildPlayerTurnSuccess(validatedTurn: ValidatedTurn): TurnResult {
  return {
    kind: SUCCESS_RESULT_KIND,
    data: validatedTurn,
  };
}

function validatePlayedCardsInTurn(
  playedCards: Card[],
  playerId: PlayerId,
  cycleState: CycleState,
): TurnResult {
  const turn = { cards: playedCards, playerId };
  const validatedTurn = validateTurn(turn, cycleState);
  return validatedTurn.valid
    ? buildPlayerTurnSuccess(validatedTurn)
    : buildPlayerTurnError(playerId, 'player is not following the game rules');
}

function broadcastTurnResult(turnResult: TurnResult, roomApi: RoomApi): void {
  return turnResult.kind === ERROR_RESULT_KIND
    ? roomApi.broadcastPlayerTurnError(turnResult.error)
    : roomApi.broadcastPlayerTurn(turnResult.data);
}

export default async function (
  player: Player,
  cycleState: CycleState,
  roomApi: RoomApi,
): Promise<TurnResult> {
  const { id: playerId } = player;

  roomApi.broadcastStartPlayerTurn(playerId);
  player.api.availableCardsInHand(cycleState.hands[playerId]);

  const playedCardsResult = await requestCards(player);

  const turnResult = playedCardsResult.kind === ERROR_RESULT_KIND
    ? buildPlayerTurnError(playerId, 'problem requesting cards from player')
    : validatePlayedCardsInTurn(playedCardsResult.data, playerId, cycleState);

  broadcastTurnResult(turnResult, roomApi);

  return turnResult;
}
