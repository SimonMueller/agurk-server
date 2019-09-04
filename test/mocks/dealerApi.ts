import { DealerApi } from '../../server/types/dealer';

export default (): jest.Mocked<DealerApi> => ({
  createHandsForPlayerIds: jest.fn(),
  samplePlayerId: jest.fn(),
});
