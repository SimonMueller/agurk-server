import WebSocket from 'ws';
import { MessageName } from 'agurk-shared';
import { string } from '@hapi/joi';
import config from 'config';
import { request } from './clientCommunication';
import { ExpectedMessage } from '../types/messageType';

const AUTHENTICATION_TIMEOUT_IN_MILLIS: number = config.get('security.authenticationTimeoutInMillis');

export default function requestAuthentication(socket: WebSocket): Promise<string> {
  const requesterMessage = {
    name: MessageName.REQUEST_AUTHENTICATION,
  } as const;
  const expectedMessage: ExpectedMessage = {
    name: MessageName.AUTHENTICATE,
    dataValidationSchema: string().required(),
  };
  return request<string>(socket, requesterMessage, expectedMessage, AUTHENTICATION_TIMEOUT_IN_MILLIS);
}
