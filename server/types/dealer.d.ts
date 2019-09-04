import { PlayerId } from '../../shared/types/player';
import { Card } from '../../shared/types/card';
import { CardCountToDeal } from './game';
import { PlayerHands } from './hand';

export type SamplePlayerId = (playerIds: PlayerId[]) => PlayerId;

export interface DealerApi {
  readonly createHandsForPlayerIds: (
    playerIds: PlayerId[],
    cardsToOmit: Card[],
    cardCountToDeal: CardCountToDeal,
  ) => PlayerHands;
  readonly samplePlayerId: SamplePlayerId;
}
