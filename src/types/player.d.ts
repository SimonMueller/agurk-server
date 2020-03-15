import { PlayerId, Card } from 'agurk-shared';

export interface PlayerApi {
  readonly isConnected: () => boolean;
  readonly dealCards: (cards: Card[]) => void;
  readonly requestCards: (x: void) => Promise<Card[]>;
  readonly availableCardsInHand: (cards: Card[]) => void;
}

export interface Player {
  readonly id: PlayerId;
  readonly api: PlayerApi;
}
