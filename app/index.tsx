import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { getRecentExpenses } from '../src/domain/recentExpenses';
import type { Category, Expense } from '../src/domain/types';
import { useRepository } from '../src/storage/RepositoryContext';

const RECENT_EXPENSE_LIMIT = 20;

export default function MainScreen() {
  const repository = useRepository();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);

      Promise.all([repository.getExpenses(), repository.getCategories()])
        .then(([expenses, loadedCategories]) => {
          if (cancelled) {
            return;
          }
          setAllExpenses(expenses);
          setCategories(loadedCategories);
          setLoadError(false);
        })
        .catch((error) => {
          console.error('Failed to load recent expenses', error);
          if (!cancelled) {
            setLoadError(true);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [repository]),
  );

  const categoryNames = useMemo(() => buildCategoryNameMap(categories), [categories]);
  const recentExpenses = useMemo(
    () => getRecentExpenses(allExpenses, RECENT_EXPENSE_LIMIT),
    [allExpenses],
  );

  async function handleSaveExpense(id: string, input: ExpenseInput): Promise<ExpenseActionResult> {
    // Mirrors periods.tsx's mutex pattern: submittingRef is checked-and-set
    // synchronously before any await, so a second tap while a save/delete is
    // in flight is declined ('busy') instead of racing against a stale
    // `allExpenses` closure and silently reverting the other write. The
    // isLoading/loadError guard blocks writes while `allExpenses` may still
    // be stale/empty (initial load, or a failed categories load sharing this
    // screen's Promise.all).
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const updated = createExpense(input, id);
      const next = allExpenses.map((expense) => (expense.id === id ? updated : expense));
      await repository.saveExpenses(next);
      setAllExpenses(next);
      return 'success';
    } catch (error) {
      console.error('Failed to update expense', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleDeleteExpense(id: string): Promise<ExpenseActionResult> {
    // Same mutex/staleness guard as handleSaveExpense above.
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const next = allExpenses.filter((expense) => expense.id !== id);
      await repository.saveExpenses(next);
      setAllExpenses(next);
      setSelectedExpenseId((current) => (current === id ? null : current));
      return 'success';
    } catch (error) {
      console.error('Failed to delete expense', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>최근 지출</Text>
      {isLoading ? null : loadError ? (
        <Text style={styles.error}>지출내역을 불러오지 못했습니다.</Text>
      ) : recentExpenses.length === 0 ? (
        <Text style={styles.empty}>아직 등록된 지출내역이 없습니다.</Text>
      ) : (
        recentExpenses.map((expense) => (
          <ExpenseEditRow
            key={expense.id}
            expense={expense}
            categories={categories}
            categoryNames={categoryNames}
            isExpanded={expense.id === selectedExpenseId}
            onToggle={() =>
              setSelectedExpenseId((current) => (current === expense.id ? null : expense.id))
            }
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#888' },
  error: { color: '#d33' },
});
