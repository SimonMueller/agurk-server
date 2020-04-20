import createWebsocket from '../mocks/websocket';
import handleConnection from '../../src/controllers/session';

describe('socket listener handling', () => {
  test('all listeners cleaned up after close connection', async (done) => {
    const socket = createWebsocket();

    handleConnection(socket, 'testsubject');

    socket.once('close', () => {
      expect(socket.listenerCount('message')).toBe(0);
      expect(socket.listenerCount('close')).toBe(0);
      expect(socket.listenerCount('ping')).toBe(0);
      expect(socket.listenerCount('pong')).toBe(0);
      expect(socket.listenerCount('open')).toBe(0);
      expect(socket.listenerCount('error')).toBe(0);

      done();
    });

    socket.emit('close');
  });
});
