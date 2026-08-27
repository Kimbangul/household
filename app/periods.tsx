import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryPieChart } from '../src/components/CategoryPieChart';
import { ExpenseEditRow, type ExpenseActionResult } from '../src/components/ExpenseEditRow';
import { buildCategoryNameMap } from '../src/domain/categoryLookup';
import { aggregateExpensesByCategory, type CategoryStat } from '../src/domain/categoryStats';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, type ExpenseInput } from '../src/domain/expense';
import { calculateNetSavings } from '../src/domain/netSavings';
import { createPeriod, isPastPeriod, suggestNextPeriodStartDate, validatePeriodInput } from '../src/domain/period';
import type { PeriodInputField } from '../src/domain/period';
import { getExpensesInPeriod, sumExpenseAmounts } from '../src/domain/periodExpenses';
import type { Category, Expense, Period } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import { useAppColors, type AppColors } from '../src/theme/useAppColors';
import { generateId } from '../src/utils/generateId';
import { parseDigitAmount } from '../src/utils/parseDigitAmount';
import { todayAsDateString } from '../src/utils/today';

type UpdateIncomeResult = 'success' | 'busy' | 'error';

interface PeriodDetail {
  expenses: Expense[];
  total: number;
  categoryNames: Record<string, string>;
  categoryStats: CategoryStat[];
}

export default function PeriodsScreen() {
  const repository = useRepository();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [periods, setPeriods] = useState<Period[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

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

      Promise.all([repository.getPeriods(), repository.getExpenses(), repository.getCategories()])
        .then(([loadedPeriods, loadedExpenses, loadedCategories]) => {
          if (cancelled) {
            return;
          }
          setPeriods(loadedPeriods);
          setExpenses(loadedExpenses);
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

  async function handleUpdateIncome(id: string, income: number): Promise<UpdateIncomeResult> {
    // Shares the add/delete mutex: a concurrent mutation would otherwise read
    // the same stale `periods` snapshot and one write would silently revert
    // the other. 'busy' is reported back so the caller doesn't show a false
    // save-failed message for what was really just a declined attempt. The
    // isLoading/loadError guard mirrors handleAddPeriod's — periods may still
    // be stale/empty while a load is in flight or failed.
    if (submittingRef.current || isLoading || loadError) {
      return 'busy';
    }

    submittingRef.current = true;
    const next = periods.map((period) => (period.id === id ? { ...period, income } : period));
    try {
      await repository.savePeriods(next);
      setPeriods(next);
      return 'success';
    } catch (error) {
      console.error('Failed to save income', error);
      return 'error';
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

  const today = todayAsDateString();
  const currentPeriods = periods.filter((period) => !isPastPeriod(period, today));
  const pastPeriods = periods.filter((period) => isPastPeriod(period, today));

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;
  const selectedPeriodExpenses = useMemo(
    () => (selectedPeriod ? getExpensesInPeriod(expenses, selectedPeriod) : []),
    [selectedPeriod, expenses],
  );
  const selectedPeriodDetail: PeriodDetail | null = selectedPeriod && {
    expenses: selectedPeriodExpenses,
    total: sumExpenseAmounts(selectedPeriodExpenses),
    categoryNames,
    categoryStats: aggregateExpensesByCategory(selectedPeriodExpenses, categoryNames),
  };

  function renderPeriodRow(period: Period) {
    return (
      <PeriodRow
        key={period.id}
        period={period}
        detail={period.id === selectedPeriodId ? selectedPeriodDetail : null}
        categories={categories}
        selectedExpenseId={selectedExpenseId}
        onToggle={() => {
          setSelectedPeriodId((current) => (current === period.id ? null : period.id));
          setSelectedExpenseId(null);
        }}
        onDelete={() => handleDeletePeriod(period.id)}
        onSaveIncome={handleUpdateIncome}
        onToggleExpense={(id) => setSelectedExpenseId((current) => (current === id ? null : id))}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>새 기간 추가</Text>

      <Text style={styles.label}>시작일</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={(value) => {
          setStartDate(value);
          startDateTouchedRef.current = true;
          clearFieldError('startDate');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      {errors.startDate ? <Text style={styles.error}>{errors.startDate}</Text> : null}

      <Text style={styles.label}>종료일</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={(value) => {
          setEndDate(value);
          clearFieldError('endDate');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      {errors.endDate ? <Text style={styles.error}>{errors.endDate}</Text> : null}

      <Pressable
        style={styles.submitButton}
        onPress={handleAddPeriod}
        disabled={isSaving || isLoading || loadError}
      >
        <Text style={styles.submitButtonText}>{isSaving ? '추가 중...' : '기간 추가'}</Text>
      </Pressable>

      {submitStatus === 'success' ? <Text style={styles.statusSuccess}>기간이 추가되었습니다.</Text> : null}
      {submitStatus === 'error' ? (
        <Text style={styles.statusError}>처리하지 못했습니다. 다시 시도해주세요.</Text>
      ) : null}

      <Text style={[styles.heading, styles.sectionHeading]}>현재/예정 기간</Text>
      {deleteError ? <Text style={styles.error}>삭제하지 못했습니다. 다시 시도해주세요.</Text> : null}
      {isLoading ? null : loadError ? (
        <Text style={styles.error}>기간을 불러오지 못했습니다.</Text>
      ) : currentPeriods.length === 0 ? (
        <Text style={styles.empty}>등록된 기간이 없습니다.</Text>
      ) : (
        currentPeriods.map(renderPeriodRow)
      )}

      <Text style={[styles.heading, styles.sectionHeading]}>지난 기간</Text>
      {isLoading || loadError ? null : pastPeriods.length === 0 ? (
        <Text style={styles.empty}>지난 기간이 없습니다.</Text>
      ) : (
        pastPeriods.map(renderPeriodRow)
      )}
    </ScrollView>
  );
}

type IncomeSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'invalid'; message: string }
  | { status: 'success' }
  | { status: 'error'; message: string };

function PeriodRow({
  period,
  detail,
  categories,
  selectedExpenseId,
  onToggle,
  onDelete,
  onSaveIncome,
  onToggleExpense,
  onSaveExpense,
  onDeleteExpense,
}: {
  period: Period;
  detail: PeriodDetail | null;
  categories: Category[];
  selectedExpenseId: string | null;
  onToggle: () => void;
  onDelete: () => void;
  onSaveIncome: (id: string, income: number) => Promise<UpdateIncomeResult>;
  onToggleExpense: (id: string) => void;
  onSaveExpense: (id: string, input: ExpenseInput) => Promise<ExpenseActionResult>;
  onDeleteExpense: (id: string) => Promise<ExpenseActionResult>;
}) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [incomeText, setIncomeText] = useState(String(period.income));
  const [saveState, setSaveState] = useState<IncomeSaveState>({ status: 'idle' });
  // Tracks whether the user has edited the field since it was last synced
  // from period.income, so a save that resolves after a newer keystroke
  // doesn't clobber the not-yet-saved text.
  const incomeTouchedRef = useRef(false);

  useEffect(() => {
    if (!incomeTouchedRef.current) {
      setIncomeText(String(period.income));
    }
  }, [period.income]);

  async function handleSaveIncome() {
    const income = parseDigitAmount(incomeText);
    if (Number.isNaN(income)) {
      setSaveState({ status: 'invalid', message: '수입은 0 이상의 정수여야 합니다.' });
      return;
    }

    setSaveState({ status: 'saving' });
    const result = await onSaveIncome(period.id, income);
    if (result === 'success') {
      incomeTouchedRef.current = false;
      setSaveState({ status: 'success' });
    } else if (result === 'busy') {
      setSaveState({ status: 'invalid', message: '다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.' });
    } else {
      setSaveState({ status: 'error', message: '저장하지 못했습니다. 다시 시도해주세요.' });
    }
  }

  const netSavings = detail ? calculateNetSavings(period.income, detail.total) : 0;

  return (
    <View>
      <View style={styles.row}>
        <Pressable style={styles.rowMain} onPress={onToggle}>
          <Text style={styles.rowText}>
            {period.startDate} ~ {period.endDate}
          </Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteText}>삭제</Text>
        </Pressable>
      </View>
      {detail ? (
        <View style={styles.detail}>
          <Text style={styles.label}>수입</Text>
          <View style={styles.incomeRow}>
            <TextInput
              style={[styles.input, styles.incomeInput]}
              value={incomeText}
              onChangeText={(value) => {
                setIncomeText(value);
                incomeTouchedRef.current = true;
                setSaveState({ status: 'idle' });
              }}
              placeholder="예: 3000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <Pressable
              style={styles.incomeSaveButton}
              onPress={handleSaveIncome}
              disabled={saveState.status === 'saving'}
            >
              <Text style={styles.incomeSaveButtonText}>
                {saveState.status === 'saving' ? '저장 중...' : '저장'}
              </Text>
            </Pressable>
          </View>
          {saveState.status === 'invalid' || saveState.status === 'error' ? (
            <Text style={styles.error}>{saveState.message}</Text>
          ) : null}
          {saveState.status === 'success' ? (
            <Text style={styles.statusSuccess}>수입이 저장되었습니다.</Text>
          ) : null}
          <Text style={styles.detailTotal}>순저축 {formatCurrency(netSavings)}</Text>
          <Text style={styles.detailTotal}>지출 합계 {formatCurrency(detail.total)}</Text>
          {detail.expenses.length === 0 ? (
            <Text style={styles.empty}>이 기간에 속하는 지출내역이 없습니다.</Text>
          ) : (
            <>
              <CategoryPieChart stats={detail.categoryStats} />
              {detail.expenses.map((expense) => (
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
              ))}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { backgroundColor: colors.background },
    container: { padding: 16, gap: 4 },
    heading: { fontSize: 20, fontWeight: '600', color: colors.text },
    sectionHeading: { marginTop: 24, marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 12, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginTop: 4,
      color: colors.text,
    },
    error: { marginTop: 4, color: colors.danger },
    empty: { color: colors.textMuted },
    submitButton: {
      marginTop: 24,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    submitButtonText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
    statusSuccess: { marginTop: 12, color: colors.success, textAlign: 'center' },
    statusError: { marginTop: 12, color: colors.danger, textAlign: 'center' },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowMain: { flexShrink: 1, flexGrow: 1 },
    rowText: { fontSize: 16, color: colors.text },
    deleteText: { color: colors.danger },
    detail: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 8,
    },
    detailTotal: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: colors.text },
    incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    incomeInput: { flex: 1, marginTop: 0 },
    incomeSaveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    incomeSaveButtonText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
