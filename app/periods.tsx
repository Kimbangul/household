import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { buildCategoryNameMap, resolveCategoryLabel } from '../src/domain/categoryLookup';
import { formatCurrency } from '../src/domain/currency';
import { createPeriod, isPastPeriod, suggestNextPeriodStartDate, validatePeriodInput } from '../src/domain/period';
import type { PeriodInputField } from '../src/domain/period';
import { getExpensesInPeriod, sumExpenseAmounts } from '../src/domain/periodExpenses';
import type { Expense, Period } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import { generateId } from '../src/utils/generateId';
import { todayAsDateString } from '../src/utils/today';

export default function PeriodsScreen() {
  const repository = useRepository();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

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

  const today = todayAsDateString();
  const currentPeriods = periods.filter((period) => !isPastPeriod(period, today));
  const pastPeriods = periods.filter((period) => isPastPeriod(period, today));

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        currentPeriods.map((period) => (
          <PeriodRow
            key={period.id}
            period={period}
            expenses={expenses}
            categoryNames={categoryNames}
            isSelected={selectedPeriodId === period.id}
            onToggle={() => setSelectedPeriodId((current) => (current === period.id ? null : period.id))}
            onDelete={() => handleDeletePeriod(period.id)}
          />
        ))
      )}

      <Text style={[styles.heading, styles.sectionHeading]}>지난 기간</Text>
      {isLoading || loadError ? null : pastPeriods.length === 0 ? (
        <Text style={styles.empty}>지난 기간이 없습니다.</Text>
      ) : (
        pastPeriods.map((period) => (
          <PeriodRow
            key={period.id}
            period={period}
            expenses={expenses}
            categoryNames={categoryNames}
            isSelected={selectedPeriodId === period.id}
            onToggle={() => setSelectedPeriodId((current) => (current === period.id ? null : period.id))}
            onDelete={() => handleDeletePeriod(period.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function PeriodRow({
  period,
  expenses,
  categoryNames,
  isSelected,
  onToggle,
  onDelete,
}: {
  period: Period;
  expenses: Expense[];
  categoryNames: Record<string, string>;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const periodExpenses = useMemo(
    () => (isSelected ? getExpensesInPeriod(expenses, period) : []),
    [isSelected, expenses, period],
  );
  const total = useMemo(() => sumExpenseAmounts(periodExpenses), [periodExpenses]);

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
      {isSelected ? (
        <View style={styles.detail}>
          <Text style={styles.detailTotal}>합계 {formatCurrency(total)}</Text>
          {periodExpenses.length === 0 ? (
            <Text style={styles.empty}>이 기간에 속하는 지출내역이 없습니다.</Text>
          ) : (
            periodExpenses.map((expense) => (
              <View key={expense.id} style={styles.detailRow}>
                <View style={styles.rowMain}>
                  <Text style={styles.item}>{expense.item}</Text>
                  <Text style={styles.meta}>
                    {expense.date} · {resolveCategoryLabel(expense.categoryId, categoryNames)}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4 },
  heading: { fontSize: 20, fontWeight: '600' },
  sectionHeading: { marginTop: 24, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  error: { marginTop: 4, color: '#d33' },
  empty: { color: '#888' },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  statusSuccess: { marginTop: 12, color: '#2a7d2a', textAlign: 'center' },
  statusError: { marginTop: 12, color: '#d33', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowMain: { flexShrink: 1, flexGrow: 1 },
  rowText: { fontSize: 16 },
  deleteText: { color: '#d33' },
  detail: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    marginBottom: 8,
  },
  detailTotal: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  item: { fontSize: 14 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '600' },
});
