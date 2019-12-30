import { PlayerApi } from '../../src/types/player';

export default (): jest.Mocked<PlayerApi> => ({
  isConnected: jest.fn(() => true),
  dealCards: jest.fn(),
  requestCards: jest.fn(),
});
