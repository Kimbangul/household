import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createAsyncStorageRepository } from './asyncStorageRepository';
import { loadCategoriesWithSeed } from './loadCategoriesWithSeed';
import type { LedgerRepository } from './types';

const RepositoryContext = createContext<LedgerRepository | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repository] = useState<LedgerRepository>(() => createAsyncStorageRepository());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCategoriesWithSeed(repository)
      .catch((error) => {
        console.error('Failed to seed default categories', error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  if (!isReady) {
    return null;
  }

  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): LedgerRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return repository;
}
