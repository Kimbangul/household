import { createInMemoryRepository } from './inMemoryRepository';
import { testsRepositoryContract } from './repository.contract';

describe('in-memory repository', () => {
  testsRepositoryContract(createInMemoryRepository);
});
