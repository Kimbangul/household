import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { CategoryChipPicker } from '../src/components/CategoryChipPicker';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, validateExpenseInput, type ExpenseInputField } from '../src/domain/expense';
import type { Category } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import { useAppColors, type AppColors } from '../src/theme/useAppColors';
import { generateId } from '../src/utils/generateId';
import { parseDigitAmount } from '../src/utils/parseDigitAmount';
import { todayAsDateString } from '../src/utils/today';

export default function AddExpenseScreen() {
  const repository = useRepository();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(todayAsDateString());
  const [item, setItem] = useState('');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const { errors, setErrors, submitStatus, setSubmitStatus, submittingRef, clearFieldError } =
    useFieldFormState<ExpenseInputField>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setSubmitStatus(null);

      repository
        .getCategories()
        .then((loaded) => {
          if (!cancelled) {
            setCategories(loaded);
            // An empty list also blocks submission (categoryId is required), so
            // treat it the same as a load failure rather than a normal empty state.
            setCategoriesError(loaded.length === 0);
          }
        })
        .catch((error) => {
          console.error('Failed to load categories', error);
          if (!cancelled) {
            setCategoriesError(true);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [repository, setSubmitStatus]),
  );

  const amount = parseDigitAmount(amountText);

  async function handleSubmit() {
    const input = {
      date,
      item,
      amount,
      categoryId,
      memo: memo.trim() ? memo.trim() : undefined,
    };

    const validation = validateExpenseInput(input);
    setErrors(validation.errors);
    setSubmitStatus(null);
    if (!validation.valid || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSaving(true);
    try {
      const expense = createExpense(input, generateId('expense'));
      const existing = await repository.getExpenses();
      await repository.saveExpenses([...existing, expense]);

      setDate(todayAsDateString());
      setItem('');
      setAmountText('');
      setCategoryId(null);
      setMemo('');
      setErrors({});
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to save expense', error);
      setSubmitStatus('error');
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.label}>날짜</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={(value) => {
          setDate(value);
          clearFieldError('date');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}

      <Text style={styles.label}>품목</Text>
      <TextInput
        style={styles.input}
        value={item}
        onChangeText={(value) => {
          setItem(value);
          clearFieldError('item');
        }}
        placeholder="예: 점심"
        placeholderTextColor={colors.textMuted}
      />
      {errors.item ? <Text style={styles.error}>{errors.item}</Text> : null}

      <Text style={styles.label}>금액</Text>
      <TextInput
        style={styles.input}
        value={amountText}
        onChangeText={(value) => {
          setAmountText(value);
          clearFieldError('amount');
        }}
        placeholder="예: 12000"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />
      {amountText.length > 0 && Number.isFinite(amount) && amount > 0 ? (
        <Text style={styles.preview}>{formatCurrency(amount)}</Text>
      ) : null}
      {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}

      <Text style={styles.label}>카테고리</Text>
      {categoriesError ? (
        <Text style={styles.error}>카테고리를 불러오지 못했습니다. 앱을 다시 시작해주세요.</Text>
      ) : (
        <CategoryChipPicker
          categories={categories}
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            clearFieldError('categoryId');
          }}
        />
      )}
      {errors.categoryId ? <Text style={styles.error}>{errors.categoryId}</Text> : null}

      <Text style={styles.label}>비고 (선택)</Text>
      <TextInput
        style={[styles.input, styles.memoInput]}
        value={memo}
        onChangeText={(value) => {
          setMemo(value);
          setSubmitStatus(null);
        }}
        placeholder="메모"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isSaving}>
        <Text style={styles.submitButtonText}>{isSaving ? '저장 중...' : '저장'}</Text>
      </Pressable>

      {submitStatus === 'success' ? (
        <Text style={styles.statusSuccess}>지출내역이 저장되었습니다.</Text>
      ) : null}
      {submitStatus === 'error' ? (
        <Text style={styles.statusError}>지출내역을 저장하지 못했습니다. 다시 시도해주세요.</Text>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { backgroundColor: colors.background },
    container: { padding: 16, gap: 4 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 12, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginTop: 4,
      color: colors.text,
    },
    memoInput: { minHeight: 60, textAlignVertical: 'top' },
    preview: { marginTop: 4, color: colors.textMuted },
    error: { marginTop: 4, color: colors.danger },
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
  });
}
