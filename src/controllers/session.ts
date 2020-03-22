import WebSocket from 'ws';
import { PlayerId } from 'agurk-shared';
import { Subscription } from 'rxjs';
import logger from '../logger';
import createPlayerApi from '../communication/playerApi';
import createRoomApi from '../communication/roomApi';
import playGame from '../game/game';
import createDealer from '../game/dealer';
import { generateId } from '../util';
import { RoomApi } from '../types/room';
import { PlayerApi } from '../types/player';

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
}

function removeSessionFromLobby(sessionToRemove: PlayerSession): void {
  lobby.sessions = lobby.sessions.filter(session => sessionToRemove.id !== session.id);
  lobby.lobbyApi = createRoomApi(lobby.sessions.map(session => session.socket));
}

function handlePlayerLeave(session: PlayerSession, observeOnStart: Subscription): void {
  session.socket.on('close', () => {
    logger.info('player left lobby', session.playerId);
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
      logger.info('game result', gameResult);
    } catch (error) {
      logger.error(error);
    } finally {
      lobby.isIdle = true;
    }
  }
}

function handlePlayerJoin(socket: WebSocket, subject: string): void {
  const session = createNewSession(socket, subject);
  addSessionToLobby(session);
  logger.info('player joined lobby', session.playerId);
  const observeOnStart = session.playerApi.onStartGame().subscribe(onStartGameReceived);
  handlePlayerLeave(session, observeOnStart);
}

export default function (socket: WebSocket, subject: string): void {
  if (lobby.sessions.length > 7) {
    logger.warn('game lobby already full. connection will be closed.');
    socket.close();
  } else if (!lobby.isIdle) {
    logger.warn('lobby is already in a running game. connection will be closed.');
    socket.close();
  } else {
    handlePlayerJoin(socket, subject);
  }
}
