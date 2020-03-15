import WebSocket from 'ws';
import { throttleTime } from 'rxjs/operators';
import logger from '../logger';
import createPlayerApi, { onStartGame } from '../communication/playerApi';
import createRoomApi from '../communication/roomApi';
import playGame from '../game/game';
import createDealer from '../game/dealer';
import { generateId } from '../util';

// TODO: proper room and session handling
let room: WebSocket[] = [];

export default function (socket: WebSocket): void {
  logger.info('client connected');

  room.push(socket);

  // TODO: check max player in room = 7 here
  if (socket === room[0]) {
    // TODO: handle unsubscribe to properly cleanup
    onStartGame(socket)
      .pipe(
        // TODO: skip if game is already running
        throttleTime(10000),
      )
      .subscribe(async () => {
        const sockets = room;
        const players = sockets.map((ws: WebSocket) => ({
          id: generateId(),
          api: createPlayerApi(ws),
        }));
        try {
          const gameResult = await playGame(players, createRoomApi(sockets), createDealer());
          logger.info(gameResult);
        } catch (error) {
          logger.error(error);
        } finally {
          room.forEach(s => s.close());
          room = [];
        }
      });
  }
}
