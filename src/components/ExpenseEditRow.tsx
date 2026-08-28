import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import { resolveCategoryLabel } from '../domain/categoryLookup';
import { formatCurrency } from '../domain/currency';
import { validateExpenseInput, type ExpenseInput, type ExpenseInputField } from '../domain/expense';
import type { Category, Expense } from '../domain/types';
import { getCategoryChipColor, getCategoryInitial } from '../theme/categoryChip';
import { FieldError, FieldInput, MemoInput } from '../theme/styledPrimitives';
import { parseDigitAmount } from '../utils/parseDigitAmount';
import { CategoryChipPicker } from './CategoryChipPicker';
import { CategoryIconChip } from './CategoryIconChip';
import {
  ActionRow,
  CompactFieldLabel as FieldLabel,
  DeleteButton,
  DeleteButtonText,
  EditForm,
  MetaText,
  RowCard,
  RowMain,
  RowStatusSuccessText as StatusSuccessText,
  SaveButton,
  SaveButtonText,
} from './editRowPrimitives';

export type ExpenseActionResult = 'success' | 'busy' | 'error';

type ExpenseActionState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'deleting' }
  | { status: 'invalid'; errors: Partial<Record<ExpenseInputField, string>> }
  | { status: 'success' }
  | { status: 'error'; message: string };

export function ExpenseEditRow({
  expense,
  categories,
  categoryNames,
  isExpanded,
  onToggle,
  onSave,
  onDelete,
  variant = 'standalone',
}: {
  expense: Expense;
  categories: Category[];
  categoryNames: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (id: string, input: ExpenseInput) => Promise<ExpenseActionResult>;
  onDelete: (id: string) => Promise<ExpenseActionResult>;
  variant?: 'standalone' | 'compact';
}) {
  const theme = useTheme();
  const [date, setDate] = useState(expense.date);
  const [item, setItem] = useState(expense.item);
  const [amountText, setAmountText] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState<string | null>(expense.categoryId);
  const [memo, setMemo] = useState(expense.memo ?? '');
  const [actionState, setActionState] = useState<ExpenseActionState>({ status: 'idle' });
  // Fields should only reset from `expense` when the row is opened, not on every
  // re-render while it's already open, or a concurrent save elsewhere would
  // clobber whatever the user is mid-typing here.
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      setDate(expense.date);
      setItem(expense.item);
      setAmountText(String(expense.amount));
      setCategoryId(expense.categoryId);
      setMemo(expense.memo ?? '');
      setActionState({ status: 'idle' });
    }
    wasExpandedRef.current = isExpanded;
  }, [isExpanded, expense]);

  const errors = actionState.status === 'invalid' ? actionState.errors : {};
  const isBusy = actionState.status === 'saving' || actionState.status === 'deleting';

  async function handleSave() {
    const input: ExpenseInput = {
      date,
      item,
      amount: parseDigitAmount(amountText),
      categoryId,
      memo: memo.trim() ? memo.trim() : undefined,
    };
    const validation = validateExpenseInput(input);
    if (!validation.valid) {
      setActionState({ status: 'invalid', errors: validation.errors });
      return;
    }
    setActionState({ status: 'saving' });
    const result = await onSave(expense.id, input);
    if (result === 'success') {
      setActionState({ status: 'success' });
    } else if (result === 'busy') {
      setActionState({ status: 'error', message: '다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.' });
    } else {
      setActionState({ status: 'error', message: '저장하지 못했습니다. 다시 시도해주세요.' });
    }
  }

  async function handleDelete() {
    setActionState({ status: 'deleting' });
    const result = await onDelete(expense.id);
    if (result === 'busy') {
      setActionState({ status: 'error', message: '다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.' });
    } else if (result === 'error') {
      setActionState({ status: 'error', message: '삭제하지 못했습니다. 다시 시도해주세요.' });
    }
  }

  const isCompact = variant === 'compact';
  const categoryLabel = resolveCategoryLabel(expense.categoryId, categoryNames);

  return (
    <RowCard>
      <SummaryRow $compact={isCompact} onPress={onToggle}>
        <CategoryIconChip
          color={getCategoryChipColor(expense.categoryId)}
          initial={getCategoryInitial(categoryLabel)}
          size={isCompact ? 'compact' : 'standalone'}
        />
        <RowMain>
          <ItemText $compact={isCompact}>{expense.item}</ItemText>
          <MetaText>{categoryLabel}</MetaText>
        </RowMain>
        <AmountText $compact={isCompact}>{formatCurrency(-expense.amount)}</AmountText>
      </SummaryRow>
      {isExpanded ? (
        <EditForm>
          <FieldLabel>날짜</FieldLabel>
          <FieldInput
            value={date}
            onChangeText={(value) => {
              setDate(value);
              setActionState({ status: 'idle' });
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
              setActionState({ status: 'idle' });
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
              setActionState({ status: 'idle' });
            }}
            placeholder="예: 12000"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
          />
          {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}

          <FieldLabel>카테고리</FieldLabel>
          <CategoryChipPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setActionState({ status: 'idle' });
            }}
          />
          {errors.categoryId ? <FieldError>{errors.categoryId}</FieldError> : null}

          <FieldLabel>비고 (선택)</FieldLabel>
          <MemoInput
            value={memo}
            onChangeText={(value) => {
              setMemo(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="메모"
            placeholderTextColor={theme.textMuted}
            multiline
          />

          {actionState.status === 'error' ? <FieldError>{actionState.message}</FieldError> : null}
          {actionState.status === 'success' ? (
            <StatusSuccessText>지출내역이 저장되었습니다.</StatusSuccessText>
          ) : null}

          <ActionRow>
            <SaveButton onPress={handleSave} disabled={isBusy}>
              <SaveButtonText>{actionState.status === 'saving' ? '저장 중...' : '저장'}</SaveButtonText>
            </SaveButton>
            <DeleteButton onPress={handleDelete} disabled={isBusy}>
              <DeleteButtonText>
                {actionState.status === 'deleting' ? '삭제 중...' : '삭제'}
              </DeleteButtonText>
            </DeleteButton>
          </ActionRow>
        </EditForm>
      ) : null}
    </RowCard>
  );
}

const SummaryRow = styled(Pressable)<{ $compact: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${(props) => (props.$compact ? '8px' : '14px')};
`;

const ItemText = styled.Text<{ $compact: boolean }>`
  font-size: ${(props) => (props.$compact ? '14px' : '16px')};
  line-height: ${(props) => (props.$compact ? '20px' : '24px')};
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
`;

const AmountText = styled.Text<{ $compact: boolean }>`
  font-size: ${(props) => (props.$compact ? '14px' : '16px')};
  line-height: ${(props) => (props.$compact ? '20px' : '24px')};
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontSemiBold};
`;
