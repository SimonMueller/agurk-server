import WebSocket from 'ws';
import { PlayerId } from 'agurk-shared';
import { Subscription } from 'rxjs';
import config from 'config';
import logger from '../logger';
import createPlayerApi from '../communication/playerApi';
import createRoomApi from '../communication/roomApi';
import playGame from '../game/game';
import createDealer from '../game/dealer';
import { generateId } from '../util';
import { RoomApi } from '../types/room';
import { PlayerApi } from '../types/player';
import SocketCloseCode from '../communication/socketCloseCode';

const PING_INTERVAL_IN_MILLIS: number = config.get('server.pingIntervalInMillis');

// TODO: consistent naming of room, lobby and session
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

function addSessionToLobby(sessionToAdd: PlayerSession): void {
  lobby.sessions.push(sessionToAdd);
  lobby.lobbyApi = createRoomApi(lobby.sessions.map(session => session.socket));
  lobby.lobbyApi.broadcastLobbyPlayers(lobby.sessions.map(session => session.playerId));
}

function removeSessionFromLobby(sessionToRemove: PlayerSession): void {
  lobby.sessions = lobby.sessions.filter(session => sessionToRemove.id !== session.id);
  lobby.lobbyApi = createRoomApi(lobby.sessions.map(session => session.socket));
  lobby.lobbyApi.broadcastLobbyPlayers(lobby.sessions.map(session => session.playerId));
}

function handlePlayerLeave(session: PlayerSession, observeOnStart: Subscription): void {
  session.socket.once('close', () => {
    logger.info('player left lobby', { playerId: session.playerId });
    observeOnStart.unsubscribe();
    removeSessionFromLobby(session);
  });
}

function createNewSession(socket: WebSocket, subject: string): PlayerSession {
  return {
    id: generateId(),
    socket,
    playerId: subject,
    playerApi: createPlayerApi(socket),
  };
}

async function onStartGameReceived(): Promise<void> {
  if (lobby.isIdle) {
    lobby.isIdle = false;
    const { sessions } = lobby;
    const players = sessions.map(session => ({
      id: session.playerId,
      api: session.playerApi,
    }));
    try {
      const gameResult = await playGame(players, lobby.lobbyApi, createDealer());
      logger.info('game finished', { result: gameResult });
    } catch (error) {
      logger.error('game error', { error });
    } finally {
      lobby.isIdle = true;
    }
  }
}

function handleKeepAlive(session: PlayerSession): void {
  const interval = setInterval(() => {
    logger.info(`sending ping to ${session.playerId}`);
    session.socket.ping();
  }, PING_INTERVAL_IN_MILLIS);
  session.socket.once('close', () => clearInterval(interval));
}

function handlePlayerJoin(socket: WebSocket, subject: string): void {
  const session = createNewSession(socket, subject);
  handleKeepAlive(session);
  addSessionToLobby(session);
  logger.info('player joined lobby', { playerId: session.playerId });
  const observeOnStart = session.playerApi.onStartGame().subscribe(onStartGameReceived);
  handlePlayerLeave(session, observeOnStart);
}

export default function (socket: WebSocket, subject: string): void {
  if (lobby.isIdle) {
    return handlePlayerJoin(socket, subject);
  }

  return socket.close(SocketCloseCode.LOBBY_NOT_IDLE, 'Cannot join lobby which is in a running game');
}
