import EventEmitter from 'events';
import WebSocket from 'ws';

// default ready state = connected (1)
export default (readyState = 1): WebSocket => Object.create(new EventEmitter(), {
  send: {
    value: jest.fn(),
  },
  readyState: {
    value: readyState,
  },
});
