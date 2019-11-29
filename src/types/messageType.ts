import { JoiObject } from '@hapi/joi';
import { MessageName } from 'agurk-shared';

export interface MessageType {
  readonly name: MessageName;
  readonly validationSchema: JoiObject;
}
