import { Schema } from 'joi';
import { MessageName } from 'agurk-shared';

export interface MessageValidationError {
  readonly message: string;
}

export interface MessageToBeValidated {
  readonly name: MessageName;
  readonly data?: unknown;
}

export interface ExpectedMessage {
  readonly name: MessageName;
  readonly dataValidationSchema: Schema;
}
