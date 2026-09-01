import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/native';

import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { isOngoingPeriod, isPastPeriod } from '../src/domain/period';
import { compareRecentPeriods } from '../src/domain/periodComparison';
import { getRecentExpenses } from '../src/domain/recentExpenses';
import type { Category, Expense, Period } from '../src/domain/types';
import { useRepository } from '../src/storage/RepositoryContext';
import {
  Badge,
  Card,
  CARD_RADIUS,
  dividerBottom,
  EmptyText,
  Heading,
  ListCard,
  Screen,
} from '../src/theme/styledPrimitives';
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

  const difference = periodComparison?.difference ?? 0;

  return (
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <HeaderBlock>
        <HeaderTitle>가계부</HeaderTitle>
        <HeaderSubtitle>지출을 기록하고 관리하세요</HeaderSubtitle>
      </HeaderBlock>

      <MainHeading>최근 기간 대비 지출</MainHeading>
      {isLoading ? null : loadError ? (
        <ErrorText>기간을 불러오지 못했습니다.</ErrorText>
      ) : periodComparison ? (
        <ComparisonBox>
          <PeriodRow $last={false}>
            <PeriodRowLeft>
              <PeriodRowTop>
                <PeriodDateText>
                  {periodComparison.latest.startDate} ~ {periodComparison.latest.endDate}
                </PeriodDateText>
                <PeriodStatusBadge period={periodComparison.latest} today={today} />
              </PeriodRowTop>
              <PeriodSubLabel>최근 기간</PeriodSubLabel>
            </PeriodRowLeft>
            <PeriodAmountText $tone="danger">{formatCurrency(periodComparison.latestTotal)}</PeriodAmountText>
          </PeriodRow>

          <PeriodRow $last={true}>
            <PeriodRowLeft>
              <PeriodRowTop>
                <PeriodDateText>
                  {periodComparison.previous.startDate} ~ {periodComparison.previous.endDate}
                </PeriodDateText>
                <PeriodStatusBadge period={periodComparison.previous} today={today} />
              </PeriodRowTop>
              <PeriodSubLabel>이전 기간</PeriodSubLabel>
            </PeriodRowLeft>
            <PeriodAmountText $tone="muted">{formatCurrency(periodComparison.previousTotal)}</PeriodAmountText>
          </PeriodRow>

          <DiffBanner>
            {difference > 0 ? (
              <DiffText $tone="danger">
                이전 대비 <DiffAmount>{formatCurrency(difference)}</DiffAmount> 더 지출했습니다
              </DiffText>
            ) : difference < 0 ? (
              <DiffText $tone="success">
                이전 대비 <DiffAmount>{formatCurrency(-difference)}</DiffAmount> 절약했습니다
              </DiffText>
            ) : (
              <DiffText $tone="muted">이전과 동일한 지출입니다</DiffText>
            )}
          </DiffBanner>
        </ComparisonBox>
      ) : (
        <EmptyText>비교할 이전 기간이 없습니다.</EmptyText>
      )}

      <SectionHeading>최근 지출</SectionHeading>
      {isLoading ? null : loadError ? (
        <ErrorText>지출내역을 불러오지 못했습니다.</ErrorText>
      ) : (
        <ListCard>
          {recentExpenses.length === 0 ? (
            <EmptyRow>
              <EmptyText>아직 등록된 지출내역이 없습니다.</EmptyText>
            </EmptyRow>
          ) : (
            recentExpenses.map((expense, index) => (
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
                variant="flat"
                isLast={index === recentExpenses.length - 1}
              />
            ))
          )}
        </ListCard>
      )}
    </Screen>
  );
}

// Periods in this app are free-form and can overlap with unrelated durations
// (docs/adr/0001) — so unlike the reference design's demo data, the
// "previous" period here isn't guaranteed to have already ended. Showing
// this on both rows (not just "최근 기간") keeps a still-accumulating
// previous total from being read as final.
//
// compareRecentPeriods already excludes not-yet-started periods from
// eligibility, so `period`/`today` here are always either ongoing or past —
// but this checks isOngoingPeriod explicitly (not just "not past") so a
// future period never gets mislabeled "진행 중" if this is ever reused
// somewhere that period list isn't pre-filtered.
function PeriodStatusBadge({ period, today }: { period: Period; today: string }) {
  if (isOngoingPeriod(period, today)) {
    return <Badge $tone="primary">진행 중</Badge>;
  }
  if (isPastPeriod(period, today)) {
    return <Badge $tone="muted">종료</Badge>;
  }
  return null;
}

const HeaderBlock = styled.View`
  margin-bottom: 8px;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  line-height: 34px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontExtraBold};
`;

const HeaderSubtitle = styled.Text`
  font-size: 14px;
  line-height: 20px;
  margin-top: 2px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

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

// Overrides Card's default padding: the period rows and diff banner below
// each provide their own padding. No `overflow: hidden` here — Card's own
// shadow is a style-object `boxShadow` bolted on outside the styled `css`
// template (see the note atop styledPrimitives.tsx), and clipping the box
// that carries it is an unnecessary risk; DiffBanner instead carries its own
// bottom corner radius so its full-bleed background still looks contained.
const ComparisonBox = styled(Card)`
  padding: 0px;
`;

const PeriodRow = styled.View<{ $last: boolean }>`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  ${dividerBottom}
`;

const PeriodRowLeft = styled.View`
  flex-shrink: 1;
`;

const PeriodRowTop = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const PeriodDateText = styled.Text`
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
`;

const PeriodSubLabel = styled.Text`
  font-size: 11px;
  line-height: 14px;
  margin-top: 2px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

// Both rows show an expense total (never income), so the emphasized tone is
// always theme.danger — named 'danger'/'muted' rather than 'primary'/'muted'
// so the prop reads as what it actually renders.
const PeriodAmountText = styled.Text<{ $tone: 'danger' | 'muted' }>`
  flex-shrink: 0;
  font-size: ${(props) => (props.$tone === 'danger' ? '16px' : '14px')};
  line-height: ${(props) => (props.$tone === 'danger' ? '22px' : '18px')};
  color: ${(props) => (props.$tone === 'danger' ? props.theme.danger : props.theme.textMuted)};
  font-family: ${(props) => props.theme.fontBold};
`;

const DiffBanner = styled.View`
  padding-vertical: 12px;
  padding-horizontal: 16px;
  border-bottom-left-radius: ${CARD_RADIUS}px;
  border-bottom-right-radius: ${CARD_RADIUS}px;
  background-color: ${(props) => props.theme.chipSurface};
`;

const DiffText = styled.Text<{ $tone: 'danger' | 'success' | 'muted' }>`
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  font-family: ${(props) => props.theme.fontMedium};
  color: ${(props) =>
    props.$tone === 'danger' ? props.theme.danger : props.$tone === 'success' ? props.theme.success : props.theme.textMuted};
`;

const DiffAmount = styled.Text`
  font-family: ${(props) => props.theme.fontBold};
`;

const EmptyRow = styled.View`
  padding-vertical: 48px;
  align-items: center;
`;
