import {
  Card, cardEquals, InvalidTurn, PlayerId, ValidatedTurn,
} from 'agurk-shared';
import { Result } from '../types/result';
import { RoomApi } from '../types/room';
import { Player } from '../types/player';
import { CycleState } from '../types/cycle';
import logger from '../logger';
import { validateTurn } from './rules';
import { ERROR_RESULT_KIND, SUCCESS_RESULT_KIND } from './common';
import { Hand } from '../types/hand';

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

function getPlayerHandAfterTurn(hand: Hand, turn: ValidatedTurn): Hand {
  return turn.valid
    ? hand.filter(cardInHand => !turn.cards.find(turnCard => cardEquals(turnCard, cardInHand)))
    : hand;
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

  const playerHandAfterTurn = getPlayerHandAfterTurn(cycleState.hands[player.id], validatedTurn);

  player.api.sendAvailableCardsInHand(playerHandAfterTurn);
  roomApi.broadcastPlayerTurn(validatedTurn);

  return validatedTurn;
}
