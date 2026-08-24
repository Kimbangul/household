import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createAsyncStorageRepository } from './asyncStorageRepository';
import { loadCategoriesWithSeed } from './loadCategoriesWithSeed';
import type { LedgerRepository } from './types';

const RepositoryContext = createContext<LedgerRepository | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repository] = useState<LedgerRepository>(() => createAsyncStorageRepository());

  useEffect(() => {
    loadCategoriesWithSeed(repository);
  }, [repository]);

  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): LedgerRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return repository;
}
