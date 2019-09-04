import { PlayerId } from '../../shared/types/player';
import { Card } from '../../shared/types/card';
import { SendableError } from '../../shared/types/communication';

export interface PlayerApi {
  readonly isConnected: () => boolean;
  readonly dealCards: (cards: Card[]) => void;
  readonly requestCards: (x: void) => Promise<Card[]>;
  readonly sendError: (error: SendableError) => void;
}

export interface Player {
  readonly id: PlayerId;
  readonly api: PlayerApi;
}
