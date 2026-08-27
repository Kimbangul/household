import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { compareRecentPeriods } from '../src/domain/periodComparison';
import { getRecentExpenses } from '../src/domain/recentExpenses';
import type { Category, Expense, Period } from '../src/domain/types';
import { useRepository } from '../src/storage/RepositoryContext';
import { useAppColors, type AppColors } from '../src/theme/useAppColors';
import { todayAsDateString } from '../src/utils/today';

const RECENT_EXPENSE_LIMIT = 20;

export default function MainScreen() {
  const repository = useRepository();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);

      Promise.all([repository.getExpenses(), repository.getCategories(), repository.getPeriods()])
        .then(([expenses, loadedCategories, loadedPeriods]) => {
          if (cancelled) {
            return;
          }
          setAllExpenses(expenses);
          setCategories(loadedCategories);
          setPeriods(loadedPeriods);
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
  const periodComparison = useMemo(
    () => compareRecentPeriods(periods, allExpenses, todayAsDateString()),
    [periods, allExpenses],
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>지난 기간 대비 지출</Text>
      {isLoading ? null : loadError ? (
        <Text style={styles.error}>기간을 불러오지 못했습니다.</Text>
      ) : periodComparison ? (
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonPeriods}>
            이전: {periodComparison.previous.startDate} ~ {periodComparison.previous.endDate}
          </Text>
          <Text style={styles.comparisonPeriods}>
            최근: {periodComparison.latest.startDate} ~ {periodComparison.latest.endDate}
          </Text>
          <Text style={styles.comparisonAmount}>
            {periodComparison.difference === 0
              ? '지출 변동이 없습니다.'
              : `${formatCurrency(Math.abs(periodComparison.difference))} ${periodComparison.difference > 0 ? '증가' : '감소'}`}
          </Text>
        </View>
      ) : (
        <Text style={styles.empty}>비교할 이전 기간이 없습니다.</Text>
      )}

      <Text style={[styles.heading, styles.sectionHeading]}>최근 지출</Text>
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { backgroundColor: colors.background },
    container: { padding: 16 },
    heading: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: colors.text },
    sectionHeading: { marginTop: 24 },
    empty: { color: colors.textMuted },
    error: { color: colors.danger },
    comparisonBox: {
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      gap: 4,
    },
    comparisonPeriods: { fontSize: 12, color: colors.textMuted },
    comparisonAmount: { fontSize: 18, fontWeight: '600', color: colors.text },
  });
}
