import { PlayerApi } from '../../server/types/player';

export default (): jest.Mocked<PlayerApi> => ({
  isConnected: jest.fn(() => true),
  dealCards: jest.fn(),
  requestCards: jest.fn(),
  sendError: jest.fn(),
});
