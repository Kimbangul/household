import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/native';

import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { formatCurrency } from '../src/domain/currency';
import { groupByDate } from '../src/domain/dateGroups';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { isPastPeriod } from '../src/domain/period';
import { compareRecentPeriods } from '../src/domain/periodComparison';
import { getRecentExpenses } from '../src/domain/recentExpenses';
import type { Category, Expense, Period } from '../src/domain/types';
import { useRepository } from '../src/storage/RepositoryContext';
import { Card, DateGroupHeading, EmptyText, Heading, Screen } from '../src/theme/styledPrimitives';
import { todayAsDateString } from '../src/utils/today';

const RECENT_EXPENSE_LIMIT = 20;
const CONTENT_CONTAINER_STYLE = { padding: 16 };

export default function MainScreen() {
  const repository = useRepository();
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
  const today = todayAsDateString();
  const periodComparison = useMemo(
    () => compareRecentPeriods(periods, allExpenses, today),
    [periods, allExpenses, today],
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
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <MainHeading>최근 기간 대비 지출</MainHeading>
      {isLoading ? null : loadError ? (
        <ErrorText>기간을 불러오지 못했습니다.</ErrorText>
      ) : periodComparison ? (
        <ComparisonBox>
          <ComparisonPeriodsText>
            이전: {periodComparison.previous.startDate} ~ {periodComparison.previous.endDate}
            {isPastPeriod(periodComparison.previous, today) ? '' : ' (진행 중)'}
          </ComparisonPeriodsText>
          <ComparisonPeriodsText>
            최근: {periodComparison.latest.startDate} ~ {periodComparison.latest.endDate}
            {isPastPeriod(periodComparison.latest, today) ? '' : ' (진행 중)'}
          </ComparisonPeriodsText>
          <ComparisonAmountText>
            {periodComparison.difference === 0
              ? '지출 변동이 없습니다.'
              : `${formatCurrency(Math.abs(periodComparison.difference))} ${periodComparison.difference > 0 ? '증가' : '감소'}`}
          </ComparisonAmountText>
        </ComparisonBox>
      ) : (
        <EmptyText>비교할 이전 기간이 없습니다.</EmptyText>
      )}

      <SectionHeading>최근 지출</SectionHeading>
      {isLoading ? null : loadError ? (
        <ErrorText>지출내역을 불러오지 못했습니다.</ErrorText>
      ) : recentExpenses.length === 0 ? (
        <EmptyText>아직 등록된 지출내역이 없습니다.</EmptyText>
      ) : (
        groupByDate(recentExpenses, today).flatMap((group) => [
          <DateGroupHeading key={`heading-${group.date}`}>{group.label}</DateGroupHeading>,
          ...group.items.map((expense) => (
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
          )),
        ])
      )}
    </Screen>
  );
}

const MainHeading = styled(Heading)`
  margin-bottom: 12px;
`;

const SectionHeading = styled(Heading)`
  margin-top: 24px;
  margin-bottom: 12px;
`;

const ErrorText = styled.Text`
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;

const ComparisonBox = styled(Card)`
  gap: 6px;
`;

const ComparisonPeriodsText = styled.Text`
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

const ComparisonAmountText = styled.Text`
  font-size: 18px;
  line-height: 26px;
  margin-top: 2px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontBold};
`;
