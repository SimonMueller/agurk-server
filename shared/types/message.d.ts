import { Sendable } from './communication';

export interface Message {
  readonly type: string;
  readonly data?: Sendable;
}
