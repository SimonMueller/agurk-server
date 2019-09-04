import { JoiObject } from '@hapi/joi';

export interface MessageType {
  readonly name: string;
  readonly validationSchema: JoiObject;
}
