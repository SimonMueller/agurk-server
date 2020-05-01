import { PlayerApi } from '../../src/types/player';

export default (): jest.Mocked<PlayerApi> => ({
  onStartGame: jest.fn(),
  isConnected: jest.fn(() => true),
  dealCards: jest.fn(),
  requestCards: jest.fn(),
  sendAvailableCardsInHand: jest.fn(),
});
