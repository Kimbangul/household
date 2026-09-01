import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import { CategoryPieChart } from '../src/components/CategoryPieChart';
import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { IncomeEntryEditRow, type IncomeEntryActionResult } from '../src/components/IncomeEntryEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { aggregateExpensesByCategory, type CategoryStat } from '../src/domain/categoryStats';
import { formatCurrency } from '../src/domain/currency';
import { groupByDate } from '../src/domain/dateGroups';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { createIncomeEntry, type IncomeEntryInput } from '../src/domain/incomeEntry';
import { calculateNetSavings } from '../src/domain/netSavings';
import { createPeriod, isPastPeriod, suggestNextPeriodStartDate, validatePeriodInput } from '../src/domain/period';
import type { PeriodInputField } from '../src/domain/period';
import { getRecordsInPeriod, sumAmounts } from '../src/domain/periodRecords';
import type { Category, Expense, IncomeEntry, Period } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import {
  DateGroupHeading,
  EmptyText,
  FieldError,
  FieldInput,
  FieldLabel,
  Heading,
  Screen,
  SectionHeading,
  StatusErrorText,
  StatusSuccessText,
  SubmitButton,
  SubmitButtonText,
} from '../src/theme/styledPrimitives';
import { generateId } from '../src/utils/generateId';
import { todayAsDateString } from '../src/utils/today';

const CONTENT_CONTAINER_STYLE = { padding: 16, gap: 4 };

interface PeriodDetail {
  expenses: Expense[];
  expenseTotal: number;
  categoryNames: Record<string, string>;
  categoryStats: CategoryStat[];
  incomeEntries: IncomeEntry[];
  incomeTotal: number;
}

export default function PeriodsScreen() {
  const repository = useRepository();
  const theme = useTheme();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedIncomeEntryId, setSelectedIncomeEntryId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { errors, setErrors, submitStatus, setSubmitStatus, submittingRef, clearFieldError } =
    useFieldFormState<PeriodInputField>();
  // Tracks whether the user has hand-edited the suggested start date since it
  // was last auto-filled, so refocusing the tab doesn't clobber their edit.
  const startDateTouchedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      setSubmitStatus(null);

      Promise.all([
        repository.getPeriods(),
        repository.getExpenses(),
        repository.getIncomeEntries(),
        repository.getCategories(),
      ])
        .then(([loadedPeriods, loadedExpenses, loadedIncomeEntries, loadedCategories]) => {
          if (cancelled) {
            return;
          }
          setPeriods(loadedPeriods);
          setExpenses(loadedExpenses);
          setIncomeEntries(loadedIncomeEntries);
          setCategories(loadedCategories);
          setCategoryNames(buildCategoryNameMap(loadedCategories));
          if (!startDateTouchedRef.current) {
            setStartDate(suggestNextPeriodStartDate(loadedPeriods, todayAsDateString()));
          }
          setLoadError(false);
        })
        .catch((error) => {
          console.error('Failed to load periods', error);
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
    }, [repository, setSubmitStatus]),
  );

  async function handleAddPeriod() {
    const input = { startDate, endDate };
    const validation = validatePeriodInput(input);
    setErrors(validation.errors);
    setSubmitStatus(null);
    // periods may still be stale/empty (initial load, or a failed load of the
    // unrelated expenses/categories that share this screen's Promise.all) —
    // saving now would overwrite on-disk periods with that stale snapshot.
    if (!validation.valid || submittingRef.current || isLoading || loadError) {
      return;
    }

    submittingRef.current = true;
    setIsSaving(true);
    try {
      const period = createPeriod(input, generateId('period'));
      const next = [...periods, period];
      await repository.savePeriods(next);

      setPeriods(next);
      startDateTouchedRef.current = false;
      setStartDate(suggestNextPeriodStartDate(next, todayAsDateString()));
      setEndDate('');
      setErrors({});
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to save period', error);
      setSubmitStatus('error');
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleDeletePeriod(id: string) {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDeleteError(false);
    const next = periods.filter((period) => period.id !== id);
    try {
      await repository.savePeriods(next);
      setPeriods(next);
      setSelectedPeriodId((current) => (current === id ? null : current));
      if (!startDateTouchedRef.current) {
        setStartDate(suggestNextPeriodStartDate(next, todayAsDateString()));
      }
    } catch (error) {
      console.error('Failed to delete period', error);
      setDeleteError(true);
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleSaveExpense(id: string, input: ExpenseInput): Promise<ExpenseActionResult> {
    // Shares the same submittingRef mutex as the period handlers above: this
    // screen's period and expense mutations both read/write from state that
    // was populated by the same load, so serializing all of them prevents a
    // period edit and an expense edit from racing on stale closures.
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const updated = createExpense(input, id);
      const next = expenses.map((expense) => (expense.id === id ? updated : expense));
      await repository.saveExpenses(next);
      setExpenses(next);
      return 'success';
    } catch (error) {
      console.error('Failed to update expense', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleDeleteExpense(id: string): Promise<ExpenseActionResult> {
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const next = expenses.filter((expense) => expense.id !== id);
      await repository.saveExpenses(next);
      setExpenses(next);
      setSelectedExpenseId((current) => (current === id ? null : current));
      return 'success';
    } catch (error) {
      console.error('Failed to delete expense', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleSaveIncomeEntry(id: string, input: IncomeEntryInput): Promise<IncomeEntryActionResult> {
    // Shares the same submittingRef mutex as every other mutation on this screen.
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const updated = createIncomeEntry(input, id);
      const next = incomeEntries.map((entry) => (entry.id === id ? updated : entry));
      await repository.saveIncomeEntries(next);
      setIncomeEntries(next);
      return 'success';
    } catch (error) {
      console.error('Failed to update income entry', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleDeleteIncomeEntry(id: string): Promise<IncomeEntryActionResult> {
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }
    submittingRef.current = true;
    try {
      const next = incomeEntries.filter((entry) => entry.id !== id);
      await repository.saveIncomeEntries(next);
      setIncomeEntries(next);
      setSelectedIncomeEntryId((current) => (current === id ? null : current));
      return 'success';
    } catch (error) {
      console.error('Failed to delete income entry', error);
      return 'error';
    } finally {
      submittingRef.current = false;
    }
  }

  const today = todayAsDateString();
  const currentPeriods = periods.filter((period) => !isPastPeriod(period, today));
  const pastPeriods = periods.filter((period) => isPastPeriod(period, today));

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;
  const selectedPeriodExpenses = useMemo(
    () => (selectedPeriod ? getRecordsInPeriod(expenses, selectedPeriod) : []),
    [selectedPeriod, expenses],
  );
  const selectedPeriodIncomeEntries = useMemo(
    () => (selectedPeriod ? getRecordsInPeriod(incomeEntries, selectedPeriod) : []),
    [selectedPeriod, incomeEntries],
  );
  const selectedPeriodDetail: PeriodDetail | null = selectedPeriod && {
    expenses: selectedPeriodExpenses,
    expenseTotal: sumAmounts(selectedPeriodExpenses),
    categoryNames,
    categoryStats: aggregateExpensesByCategory(selectedPeriodExpenses, categoryNames),
    incomeEntries: selectedPeriodIncomeEntries,
    incomeTotal: sumAmounts(selectedPeriodIncomeEntries),
  };

  function renderPeriodRow(period: Period) {
    return (
      <PeriodRow
        key={period.id}
        period={period}
        detail={period.id === selectedPeriodId ? selectedPeriodDetail : null}
        categories={categories}
        selectedExpenseId={selectedExpenseId}
        selectedIncomeEntryId={selectedIncomeEntryId}
        onToggle={() => {
          setSelectedPeriodId((current) => (current === period.id ? null : period.id));
          setSelectedExpenseId(null);
          setSelectedIncomeEntryId(null);
        }}
        onDelete={() => handleDeletePeriod(period.id)}
        onToggleExpense={(id) => setSelectedExpenseId((current) => (current === id ? null : id))}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
        onToggleIncomeEntry={(id) => setSelectedIncomeEntryId((current) => (current === id ? null : id))}
        onSaveIncomeEntry={handleSaveIncomeEntry}
        onDeleteIncomeEntry={handleDeleteIncomeEntry}
      />
    );
  }

  return (
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <Heading>새 기간 추가</Heading>

      <FieldLabel>시작일</FieldLabel>
      <FieldInput
        value={startDate}
        onChangeText={(value) => {
          setStartDate(value);
          startDateTouchedRef.current = true;
          clearFieldError('startDate');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />
      {errors.startDate ? <FieldError>{errors.startDate}</FieldError> : null}

      <FieldLabel>종료일</FieldLabel>
      <FieldInput
        value={endDate}
        onChangeText={(value) => {
          setEndDate(value);
          clearFieldError('endDate');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />
      {errors.endDate ? <FieldError>{errors.endDate}</FieldError> : null}

      <SubmitButton onPress={handleAddPeriod} disabled={isSaving || isLoading || loadError}>
        <SubmitButtonText>{isSaving ? '추가 중...' : '기간 추가'}</SubmitButtonText>
      </SubmitButton>

      {submitStatus === 'success' ? <StatusSuccessText>기간이 추가되었습니다.</StatusSuccessText> : null}
      {submitStatus === 'error' ? (
        <StatusErrorText>처리하지 못했습니다. 다시 시도해주세요.</StatusErrorText>
      ) : null}

      <SectionHeading>현재/예정 기간</SectionHeading>
      {deleteError ? <FieldError>삭제하지 못했습니다. 다시 시도해주세요.</FieldError> : null}
      {isLoading ? null : loadError ? (
        <FieldError>기간을 불러오지 못했습니다.</FieldError>
      ) : currentPeriods.length === 0 ? (
        <EmptyText>등록된 기간이 없습니다.</EmptyText>
      ) : (
        currentPeriods.map(renderPeriodRow)
      )}

      <SectionHeading>지난 기간</SectionHeading>
      {isLoading || loadError ? null : pastPeriods.length === 0 ? (
        <EmptyText>지난 기간이 없습니다.</EmptyText>
      ) : (
        pastPeriods.map(renderPeriodRow)
      )}
    </Screen>
  );
}

function PeriodRow({
  period,
  detail,
  categories,
  selectedExpenseId,
  selectedIncomeEntryId,
  onToggle,
  onDelete,
  onToggleExpense,
  onSaveExpense,
  onDeleteExpense,
  onToggleIncomeEntry,
  onSaveIncomeEntry,
  onDeleteIncomeEntry,
}: {
  period: Period;
  detail: PeriodDetail | null;
  categories: Category[];
  selectedExpenseId: string | null;
  selectedIncomeEntryId: string | null;
  onToggle: () => void;
  onDelete: () => void;
  onToggleExpense: (id: string) => void;
  onSaveExpense: (id: string, input: ExpenseInput) => Promise<ExpenseActionResult>;
  onDeleteExpense: (id: string) => Promise<ExpenseActionResult>;
  onToggleIncomeEntry: (id: string) => void;
  onSaveIncomeEntry: (id: string, input: IncomeEntryInput) => Promise<IncomeEntryActionResult>;
  onDeleteIncomeEntry: (id: string) => Promise<IncomeEntryActionResult>;
}) {
  const netSavings = detail ? calculateNetSavings(detail.incomeTotal, detail.expenseTotal) : 0;
  const today = todayAsDateString();

  return (
    <View>
      <PeriodHeaderRow>
        <PeriodTogglePressable onPress={onToggle}>
          <PeriodRangeText>
            {period.startDate} ~ {period.endDate}
          </PeriodRangeText>
        </PeriodTogglePressable>
        <Pressable onPress={onDelete}>
          <DeleteText>삭제</DeleteText>
        </Pressable>
      </PeriodHeaderRow>
      {detail ? (
        <DetailBox>
          <DetailTotalText>수입 합계 {formatCurrency(detail.incomeTotal)}</DetailTotalText>
          <DetailTotalText>지출 합계 {formatCurrency(detail.expenseTotal)}</DetailTotalText>
          <NetSavingsText>순저축 {formatCurrency(netSavings)}</NetSavingsText>

          <SubsectionHeading>수입내역</SubsectionHeading>
          {detail.incomeEntries.length === 0 ? (
            <EmptyText>이 기간에 속하는 수입내역이 없습니다.</EmptyText>
          ) : (
            groupByDate(detail.incomeEntries, today).flatMap((group) => [
              <DateGroupHeading key={`income-heading-${group.date}`}>{group.label}</DateGroupHeading>,
              ...group.items.map((entry) => (
                <IncomeEntryEditRow
                  key={entry.id}
                  entry={entry}
                  isExpanded={entry.id === selectedIncomeEntryId}
                  onToggle={() => onToggleIncomeEntry(entry.id)}
                  onSave={onSaveIncomeEntry}
                  onDelete={onDeleteIncomeEntry}
                />
              )),
            ])
          )}

          <SubsectionHeading>지출내역</SubsectionHeading>
          {detail.expenses.length === 0 ? (
            <EmptyText>이 기간에 속하는 지출내역이 없습니다.</EmptyText>
          ) : (
            <>
              <CategoryPieChart stats={detail.categoryStats} />
              {groupByDate(detail.expenses, today).flatMap((group) => [
                <DateGroupHeading key={`expense-heading-${group.date}`}>{group.label}</DateGroupHeading>,
                ...group.items.map((expense) => (
                  <ExpenseEditRow
                    key={expense.id}
                    expense={expense}
                    categories={categories}
                    categoryNames={detail.categoryNames}
                    isExpanded={expense.id === selectedExpenseId}
                    onToggle={() => onToggleExpense(expense.id)}
                    onSave={onSaveExpense}
                    onDelete={onDeleteExpense}
                    variant="compact"
                  />
                )),
              ])}
            </>
          )}
        </DetailBox>
      ) : null}
    </View>
  );
}

const PeriodHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.border};
`;

const PeriodTogglePressable = styled(Pressable)`
  flex-shrink: 1;
  flex-grow: 1;
`;

const PeriodRangeText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
`;

const DeleteText = styled.Text`
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;

// Plain spacing wrapper: the totals/headings sit directly on the screen
// background, while the actual income/expense row lists box themselves via
// ListCard — two nested cards here would just double up the shadow/radius.
const DetailBox = styled.View`
  padding-vertical: 4px;
  margin-bottom: 16px;
`;

const DetailTotalText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 6px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

const NetSavingsText = styled(DetailTotalText)`
  font-family: ${(props) => props.theme.fontBold};
`;

const SubsectionHeading = styled.Text`
  font-size: 14px;
  line-height: 20px;
  margin-top: 16px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontSemiBold};
`;
