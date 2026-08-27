import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import styled, { useTheme } from 'styled-components/native';

import { CategoryChipPicker } from '../src/components/CategoryChipPicker';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, validateExpenseInput, type ExpenseInputField } from '../src/domain/expense';
import type { Category } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import {
  FieldError,
  FieldInput,
  FieldLabel,
  MemoInput,
  Screen,
  StatusErrorText,
  StatusSuccessText,
  SubmitButton,
  SubmitButtonText,
} from '../src/theme/styledPrimitives';
import { generateId } from '../src/utils/generateId';
import { parseDigitAmount } from '../src/utils/parseDigitAmount';
import { todayAsDateString } from '../src/utils/today';

const CONTENT_CONTAINER_STYLE = { padding: 16, gap: 4 };

export default function AddExpenseScreen() {
  const repository = useRepository();
  const theme = useTheme();

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
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <FieldLabel>날짜</FieldLabel>
      <FieldInput
        value={date}
        onChangeText={(value) => {
          setDate(value);
          clearFieldError('date');
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />
      {errors.date ? <FieldError>{errors.date}</FieldError> : null}

      <FieldLabel>품목</FieldLabel>
      <FieldInput
        value={item}
        onChangeText={(value) => {
          setItem(value);
          clearFieldError('item');
        }}
        placeholder="예: 점심"
        placeholderTextColor={theme.textMuted}
      />
      {errors.item ? <FieldError>{errors.item}</FieldError> : null}

      <FieldLabel>금액</FieldLabel>
      <FieldInput
        value={amountText}
        onChangeText={(value) => {
          setAmountText(value);
          clearFieldError('amount');
        }}
        placeholder="예: 12000"
        placeholderTextColor={theme.textMuted}
        keyboardType="numeric"
      />
      {amountText.length > 0 && Number.isFinite(amount) && amount > 0 ? (
        <PreviewText>{formatCurrency(amount)}</PreviewText>
      ) : null}
      {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}

      <FieldLabel>카테고리</FieldLabel>
      {categoriesError ? (
        <FieldError>카테고리를 불러오지 못했습니다. 앱을 다시 시작해주세요.</FieldError>
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
      {errors.categoryId ? <FieldError>{errors.categoryId}</FieldError> : null}

      <FieldLabel>비고 (선택)</FieldLabel>
      <MemoInput
        value={memo}
        onChangeText={(value) => {
          setMemo(value);
          setSubmitStatus(null);
        }}
        placeholder="메모"
        placeholderTextColor={theme.textMuted}
        multiline
      />

      <SubmitButton onPress={handleSubmit} disabled={isSaving}>
        <SubmitButtonText>{isSaving ? '저장 중...' : '저장'}</SubmitButtonText>
      </SubmitButton>

      {submitStatus === 'success' ? <StatusSuccessText>지출내역이 저장되었습니다.</StatusSuccessText> : null}
      {submitStatus === 'error' ? (
        <StatusErrorText>지출내역을 저장하지 못했습니다. 다시 시도해주세요.</StatusErrorText>
      ) : null}
    </Screen>
  );
}

const PreviewText = styled.Text`
  margin-top: 4px;
  color: ${(props) => props.theme.textMuted};
`;
