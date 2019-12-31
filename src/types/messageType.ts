import { JoiObject } from '@hapi/joi';
import { MessageName } from 'agurk-shared';

export interface MessageToBeValidated {
  readonly name: MessageName;
  readonly data?: unknown;
}

export interface ExpectedMessage {
  readonly name: MessageName;
  readonly dataValidationSchema: JoiObject;
}
