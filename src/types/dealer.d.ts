import { PlayerId, Card } from 'agurk-shared';
import { CardCountToDeal } from './game';
import { HandsByPlayerId } from './hand';

export type SamplePlayerId = (playerIds: PlayerId[]) => PlayerId | undefined;

export interface Dealer {
  readonly createHandsForPlayerIds: (
    playerIds: PlayerId[],
    cardsToOmit: Card[],
    cardCountToDeal: CardCountToDeal,
  ) => HandsByPlayerId;
  readonly samplePlayerId: SamplePlayerId;
}
