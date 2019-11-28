import { RoomApi } from '../../src/types/room';

export default (): jest.Mocked<RoomApi> => ({
  broadcastStartGame: jest.fn(),
  broadcastStartRound: jest.fn(),
  broadcastStartCycle: jest.fn(),
  broadcastStartPlayerTurn: jest.fn(),
  broadcastPlayerTurn: jest.fn(),
  broadcastEndCycle: jest.fn(),
  broadcastEndRound: jest.fn(),
  broadcastPlayers: jest.fn(),
  broadcastGameWinner: jest.fn(),
  broadcastPlayerOrder: jest.fn(),
  broadcastRoundWinner: jest.fn(),
  broadcastPenalties: jest.fn(),
  broadcastOutPlayers: jest.fn(),
  broadcastEndGame: jest.fn(),
  broadcastGameError: jest.fn(),
  broadcastPlayerTurnError: jest.fn(),
});
