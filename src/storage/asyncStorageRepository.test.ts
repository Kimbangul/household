import { createAsyncStorageRepository } from './asyncStorageRepository';
import { testsRepositoryContract } from './repository.contract';

describe('AsyncStorage-backed repository', () => {
  testsRepositoryContract(createAsyncStorageRepository);
});
