import { Message } from '../types/message';
import { MessageType } from '../types/messageType';
import { Sendable } from '../types/communication';

export default function create(messageType: MessageType, data?: Sendable): Message {
  return {
    type: messageType.name,
    data,
  };
}
