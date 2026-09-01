import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import { CategoryChipPicker } from '../src/components/CategoryChipPicker';
import { formatCurrency } from '../src/domain/currency';
import { createExpense, validateExpenseInput, type ExpenseInputField } from '../src/domain/expense';
import { createIncomeEntry, validateIncomeEntryInput } from '../src/domain/incomeEntry';
import type { Category } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import {
  Card,
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
import { withAlpha } from '../src/theme/withAlpha';
import { generateId } from '../src/utils/generateId';
import { parseDigitAmount } from '../src/utils/parseDigitAmount';
import { todayAsDateString } from '../src/utils/today';

const CONTENT_CONTAINER_STYLE = { padding: 16, gap: 4 };

type EntryMode = 'expense' | 'income';

export default function AddExpenseScreen() {
  const repository = useRepository();
  const theme = useTheme();

  const [mode, setMode] = useState<EntryMode>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(todayAsDateString());
  const [item, setItem] = useState('');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  // ExpenseInputField ('date'|'item'|'amount'|'categoryId') is a superset of
  // IncomeEntryInputField ('date'|'item'|'amount'), so one error/status state
  // covers both modes' fields — categoryId simply never gets set in income mode.
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

  function resetForm() {
    setDate(todayAsDateString());
    setItem('');
    setAmountText('');
    setCategoryId(null);
    setMemo('');
    setErrors({});
  }

  function handleModeChange(nextMode: EntryMode) {
    setMode(nextMode);
    resetForm();
    setSubmitStatus(null);
  }

  async function handleSubmitExpense() {
    const input = { date, item, amount, categoryId, memo: memo.trim() ? memo.trim() : undefined };
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
      resetForm();
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to save expense', error);
      setSubmitStatus('error');
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleSubmitIncomeEntry() {
    const input = { date, item, amount, memo: memo.trim() ? memo.trim() : undefined };
    const validation = validateIncomeEntryInput(input);
    setErrors(validation.errors);
    setSubmitStatus(null);
    if (!validation.valid || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSaving(true);
    try {
      const incomeEntry = createIncomeEntry(input, generateId('income'));
      const existing = await repository.getIncomeEntries();
      await repository.saveIncomeEntries([...existing, incomeEntry]);
      resetForm();
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to save income entry', error);
      setSubmitStatus('error');
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  const handleSubmit = mode === 'expense' ? handleSubmitExpense : handleSubmitIncomeEntry;

  return (
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <ModeToggleRow>
        <ModeToggleButton $active={mode === 'expense'} onPress={() => handleModeChange('expense')}>
          <ModeToggleText $active={mode === 'expense'}>지출</ModeToggleText>
        </ModeToggleButton>
        <ModeToggleButton $active={mode === 'income'} onPress={() => handleModeChange('income')}>
          <ModeToggleText $active={mode === 'income'}>수입</ModeToggleText>
        </ModeToggleButton>
      </ModeToggleRow>

      <Card>
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

        <FieldLabel>{mode === 'expense' ? '품목' : '내용'}</FieldLabel>
        <FieldInput
          value={item}
          onChangeText={(value) => {
            setItem(value);
            clearFieldError('item');
          }}
          placeholder={mode === 'expense' ? '예: 점심' : '예: 8월 급여'}
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
          placeholder={mode === 'expense' ? '예: 12000' : '예: 3000000'}
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
        />
        {amountText.length > 0 && Number.isFinite(amount) && amount > 0 ? (
          <PreviewText $mode={mode}>{formatCurrency(amount)}</PreviewText>
        ) : null}
        {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}

        {mode === 'expense' ? (
          <>
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
          </>
        ) : null}

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

        {submitStatus === 'success' ? (
          <StatusSuccessText>
            {mode === 'expense' ? '지출내역이 저장되었습니다.' : '수입내역이 저장되었습니다.'}
          </StatusSuccessText>
        ) : null}
        {submitStatus === 'error' ? (
          <StatusErrorText>저장하지 못했습니다. 다시 시도해주세요.</StatusErrorText>
        ) : null}
      </Card>
    </Screen>
  );
}

// A hero-sized live preview of the amount as it's typed — the biggest number
// on the screen, colored per the active mode's meaning (expense=danger,
// income=primary, same as everywhere else amounts are shown).
const PreviewText = styled.Text<{ $mode: EntryMode }>`
  margin-top: 8px;
  text-align: center;
  font-size: 32px;
  line-height: 40px;
  color: ${(props) => (props.$mode === 'expense' ? props.theme.danger : props.theme.primary)};
  font-family: ${(props) => props.theme.fontExtraBold};
`;

// Neumorphic track (inset shadow) holding the two mode buttons — the active
// one lifts off the track with a solid fill + soft colored shadow. boxShadow
// can't live inside a styled `css` template (styled-components/native's CSS
// parser doesn't recognize the declaration and throws at runtime), so both
// shadows here are built as style objects via `useTheme()` instead.
const ModeToggleRowBase = styled.View`
  flex-direction: row;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  background-color: ${(props) => props.theme.background};
  margin-bottom: 8px;
`;

function ModeToggleRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <ModeToggleRowBase style={{ boxShadow: theme.insetShadow }}>{children}</ModeToggleRowBase>;
}

const ModeToggleButtonBase = styled(Pressable)<{ $active: boolean }>`
  flex: 1;
  border-radius: 13px;
  padding-vertical: 10px;
  align-items: center;
  background-color: ${(props) => (props.$active ? props.theme.primary : 'transparent')};
`;

function ModeToggleButton({
  $active,
  onPress,
  children,
}: {
  $active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <ModeToggleButtonBase
      $active={$active}
      onPress={onPress}
      style={{ boxShadow: $active ? `0px 6px 16px -4px ${withAlpha(theme.primary, 0.4)}` : 'none' }}
    >
      {children}
    </ModeToggleButtonBase>
  );
}

const ModeToggleText = styled.Text<{ $active: boolean }>`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => (props.$active ? props.theme.onPrimary : props.theme.textMuted)};
  font-family: ${(props) => props.theme.fontBold};
`;
