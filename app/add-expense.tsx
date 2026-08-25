import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatCurrency } from '../src/domain/currency';
import { createExpense, validateExpenseInput, type ExpenseInputField } from '../src/domain/expense';
import type { Category } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import { generateId } from '../src/utils/generateId';
import { todayAsDateString } from '../src/utils/today';

// Digit strings longer than this lose precision once converted to a JS
// number (Number.MAX_SAFE_INTEGER has 16 digits) — no real 원화 amount needs it.
const AMOUNT_PATTERN = /^\d{1,15}$/;

function parseAmountInput(text: string): number {
  // Reject anything Number() would otherwise accept loosely (scientific
  // notation, hex, decimals) — only plain digit strings are a valid 원화 amount.
  return AMOUNT_PATTERN.test(text) ? Number(text) : NaN;
}

export default function AddExpenseScreen() {
  const repository = useRepository();

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

  const amount = parseAmountInput(amountText);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>날짜</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={(value) => {
          setDate(value);
          clearFieldError('date');
        }}
        placeholder="YYYY-MM-DD"
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
        <View style={styles.categoryList}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                clearFieldError('categoryId');
              }}
              style={[styles.categoryChip, categoryId === category.id && styles.categoryChipSelected]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categoryId === category.id && styles.categoryChipTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
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

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  memoInput: { minHeight: 60, textAlignVertical: 'top' },
  preview: { marginTop: 4, color: '#888' },
  error: { marginTop: 4, color: '#d33' },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoryChipSelected: { backgroundColor: '#333', borderColor: '#333' },
  categoryChipText: { color: '#333' },
  categoryChipTextSelected: { color: '#fff' },
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
});
