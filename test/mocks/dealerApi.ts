import { DealerApi } from '../../src/types/dealer';

export default (): jest.Mocked<DealerApi> => ({
  createHandsForPlayerIds: jest.fn(),
  samplePlayerId: jest.fn(),
});
