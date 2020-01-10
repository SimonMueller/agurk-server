import WebSocket from 'ws';
import { throttleTime } from 'rxjs/operators';
import logger from '../logger';
import createPlayerApi, { onStartGame } from '../communication/playerCommunication';
import createRoomApi from '../communication/roomCommunication';
import playGame from '../game/game';
import { createHandsForPlayerIds, samplePlayerId } from '../game/dealer';
import { DealerApi } from '../types/dealer';
import { generateId } from '../util';

// TODO: proper room and session handling
const room: WebSocket[] = [];

function createDealerApi(): DealerApi {
  return {
    createHandsForPlayerIds,
    samplePlayerId,
  };
}

export default async function (socket: WebSocket): Promise<void> {
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
          const gameResult = await playGame(players, createRoomApi(sockets), createDealerApi());
          logger.info(gameResult);
        } catch (error) {
          logger.error(error);
        }
      });
  }
}
