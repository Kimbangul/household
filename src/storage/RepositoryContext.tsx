import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createAsyncStorageRepository } from './asyncStorageRepository';
import { loadCategoriesWithSeed } from './loadCategoriesWithSeed';
import { migrateIncomeEntriesFromPeriods } from './migrateLegacyPeriodIncome';
import type { LedgerRepository } from './types';

const RepositoryContext = createContext<LedgerRepository | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repository] = useState<LedgerRepository>(() => createAsyncStorageRepository());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadCategoriesWithSeed(repository), migrateIncomeEntriesFromPeriods(repository)])
      .catch((error) => {
        console.error('Failed to run startup migrations', error);
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
