import { PlayerId, Card } from 'agurk-shared';
import { Observable } from 'rxjs';

export interface PlayerApi {
  readonly onStartGame: (x: void) => Observable<void>;
  readonly isConnected: () => boolean;
  readonly dealCards: (cards: Card[]) => void;
  readonly requestCards: (retriesLeft: number) => Promise<Card[]>;
  readonly sendAvailableCardsInHand: (cards: Card[]) => void;
}

export interface Player {
  readonly id: PlayerId;
  readonly api: PlayerApi;
}
