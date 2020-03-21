import EventEmitter from 'events';
import WebSocket from 'ws';

export default (
  readyState = WebSocket.OPEN,
  callbackError?: Error,
): WebSocket => Object.create(new EventEmitter(), {
  send: {
    value: jest.fn((value, callback) => callback(callbackError)),
  },
  readyState: {
    value: readyState,
  },
});
