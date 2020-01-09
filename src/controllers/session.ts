import { partial } from 'ramda';
import WebSocket from 'ws';
import { throttleTime } from 'rxjs/operators';
import logger from '../logger';
import * as playerCommunication from '../communication/playerCommunication';
import * as roomCommunication from '../communication/roomCommunication';
import playGame from '../game/game';
import { createHandsForPlayerIds, samplePlayerId } from '../game/dealer';
import { DealerApi } from '../types/dealer';
import { PlayerApi } from '../types/player';
import { RoomApi } from '../types/room';
import { generateId } from '../util';

// TODO: proper room and session handling
const room: WebSocket[] = [];

function createPlayerApi(socket: WebSocket): PlayerApi {
  return {
    isConnected: (): boolean => socket.readyState === WebSocket.OPEN,
    dealCards: partial(playerCommunication.dealCards, [socket]),
    requestCards: partial(playerCommunication.requestCards, [socket]),
    availableCards: partial(playerCommunication.availableCards, [socket]),
  };
}

function createRoomApi(sockets: WebSocket[]): RoomApi {
  return {
    broadcastStartGame: partial(roomCommunication.broadcastStartGame, [sockets]),
    broadcastStartRound: partial(roomCommunication.broadcastStartRound, [sockets]),
    broadcastStartCycle: partial(roomCommunication.broadcastStartCycle, [sockets]),
    broadcastStartPlayerTurn: partial(roomCommunication.broadcastStartPlayerTurn, [sockets]),
    broadcastPlayerTurn: partial(roomCommunication.broadcastPlayerTurn, [sockets]),
    broadcastEndCycle: partial(roomCommunication.broadcastEndCycle, [sockets]),
    broadcastEndRound: partial(roomCommunication.broadcastEndRound, [sockets]),
    broadcastPlayers: partial(roomCommunication.broadcastPlayers, [sockets]),
    broadcastGameWinner: partial(roomCommunication.broadcastGameWinner, [sockets]),
    broadcastPlayerOrder: partial(roomCommunication.broadcastPlayerOrder, [sockets]),
    broadcastRoundWinner: partial(roomCommunication.broadcastRoundWinner, [sockets]),
    broadcastPenalties: partial(roomCommunication.broadcastPenalties, [sockets]),
    broadcastOutPlayers: partial(roomCommunication.broadcastOutPlayers, [sockets]),
    broadcastEndGame: partial(roomCommunication.broadcastEndGame, [sockets]),
    broadcastGameError: partial(roomCommunication.broadcastGameError, [sockets]),
    broadcastPlayerTurnError: partial(roomCommunication.broadcastPlayerTurnError, [sockets]),
  };
}

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
    playerCommunication.onStartGame(socket)
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
