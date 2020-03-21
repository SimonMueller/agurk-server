import WebSocket from 'ws';
import { PlayerId } from 'agurk-shared';
import logger from '../logger';
import createPlayerApi from '../communication/playerApi';
import createRoomApi from '../communication/roomApi';
import playGame from '../game/game';
import createDealer from '../game/dealer';
import { generateId } from '../util';
import { RoomApi } from '../types/room';
import { PlayerApi } from '../types/player';

// TODO: proper lobby and session handling
const lobby: Lobby = {
  isIdle: true,
  sessions: [],
  lobbyApi: createRoomApi([]),
};

interface PlayerSession {
  readonly id: string;
  readonly socket: WebSocket;
  readonly playerId: PlayerId;
  readonly playerApi: PlayerApi;
}

interface Lobby {
  isIdle: boolean;
  sessions: PlayerSession[];
  lobbyApi: RoomApi;
}

export default function (socket: WebSocket): void {
  if (lobby.sessions.length > 7) {
    logger.warn('game lobby already full. connection will be closed.');
    socket.close();
  } else if (!lobby.isIdle) {
    logger.warn('lobby is already in a running game. connection will be closed.');
    socket.close();
  } else {
    const currentSession = {
      id: generateId(),
      socket,
      playerId: generateId(),
      playerApi: createPlayerApi(socket),
    };

    logger.info('player joined lobby', currentSession.playerId);

    lobby.sessions.push(currentSession);
    lobby.lobbyApi = createRoomApi(lobby.sessions.map(session => session.socket));

    const observeOnStart = currentSession.playerApi.onStartGame().subscribe(
      async () => {
        if (lobby.isIdle) {
          lobby.isIdle = false;
          const { sessions } = lobby;
          const sockets = sessions.map(session => session.socket);
          const players = sessions.map(session => ({
            id: session.playerId,
            api: createPlayerApi(session.socket),
          }));
          try {
            const gameResult = await playGame(players, createRoomApi(sockets), createDealer());
            logger.info('game result', gameResult);
          } catch (error) {
            logger.error(error);
          } finally {
            lobby.isIdle = true;
          }
        }
      },
    );

    currentSession.socket.on('close', () => {
      logger.info('player left lobby', currentSession.playerId);
      observeOnStart.unsubscribe();
      lobby.sessions = lobby.sessions.filter(session => session.id !== currentSession.id);
      lobby.lobbyApi = createRoomApi(lobby.sessions.map(session => session.socket));
    });
  }
}
