import { RoomApi } from '../../src/types/room';

export default (): jest.Mocked<RoomApi> => ({
  broadcastStartGame: jest.fn(),
  broadcastStartRound: jest.fn(),
  broadcastStartCycle: jest.fn(),
  broadcastStartPlayerTurn: jest.fn(),
  broadcastPlayerTurn: jest.fn(),
  broadcastEndCycle: jest.fn(),
  broadcastEndRound: jest.fn(),
  broadcastEndGame: jest.fn(),
  broadcastGameError: jest.fn(),
  broadcastPlayerTurnError: jest.fn(),
});
