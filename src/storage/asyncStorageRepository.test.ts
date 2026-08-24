import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAsyncStorageRepository } from './asyncStorageRepository';
import { testsRepositoryContract } from './repository.contract';

describe('AsyncStorage-backed repository', () => {
  testsRepositoryContract(createAsyncStorageRepository);

  test('treats a corrupted stored value as empty instead of throwing', async () => {
    await AsyncStorage.setItem('household-ledger/expenses', '{not valid json');
    const repository = createAsyncStorageRepository();

    await expect(repository.getExpenses()).resolves.toEqual([]);
  });
});
