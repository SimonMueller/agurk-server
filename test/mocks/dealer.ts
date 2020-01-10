import { Dealer } from '../../src/types/dealer';

export default (): jest.Mocked<Dealer> => ({
  createHandsForPlayerIds: jest.fn(),
  samplePlayerId: jest.fn(),
});
