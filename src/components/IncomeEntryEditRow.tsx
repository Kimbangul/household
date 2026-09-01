import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import { formatCurrency } from '../domain/currency';
import {
  validateIncomeEntryInput,
  type IncomeEntryInput,
  type IncomeEntryInputField,
} from '../domain/incomeEntry';
import type { IncomeEntry } from '../domain/types';
import { FieldError, FieldInput } from '../theme/styledPrimitives';
import { parseDigitAmount } from '../utils/parseDigitAmount';
import { CategoryIconChip } from './CategoryIconChip';
import {
  ActionRow,
  CompactFieldLabel as FieldLabel,
  DeleteButton,
  DeleteButtonText,
  EditForm,
  RowCard,
  RowMain,
  RowStatusSuccessText as StatusSuccessText,
  SaveButton,
  SaveButtonText,
} from './editRowPrimitives';

export type IncomeEntryActionResult = 'success' | 'busy' | 'error';

type IncomeEntryActionState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'deleting' }
  | { status: 'invalid'; errors: Partial<Record<IncomeEntryInputField, string>> }
  | { status: 'success' }
  | { status: 'error'; message: string };

export function IncomeEntryEditRow({
  entry,
  isExpanded,
  onToggle,
  onSave,
  onDelete,
}: {
  entry: IncomeEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (id: string, input: IncomeEntryInput) => Promise<IncomeEntryActionResult>;
  onDelete: (id: string) => Promise<IncomeEntryActionResult>;
}) {
  const theme = useTheme();
  const [date, setDate] = useState(entry.date);
  const [item, setItem] = useState(entry.item);
  const [amountText, setAmountText] = useState(String(entry.amount));
  const [memo, setMemo] = useState(entry.memo ?? '');
  const [actionState, setActionState] = useState<IncomeEntryActionState>({ status: 'idle' });
  // Same guard as ExpenseEditRow: only reset fields from `entry` when the row
  // is opened, not on every re-render while it's already open.
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      setDate(entry.date);
      setItem(entry.item);
      setAmountText(String(entry.amount));
      setMemo(entry.memo ?? '');
      setActionState({ status: 'idle' });
    }
    wasExpandedRef.current = isExpanded;
  }, [isExpanded, entry]);

  const errors = actionState.status === 'invalid' ? actionState.errors : {};
  const isBusy = actionState.status === 'saving' || actionState.status === 'deleting';

  async function handleSave() {
    const input: IncomeEntryInput = {
      date,
      item,
      amount: parseDigitAmount(amountText),
      memo: memo.trim() ? memo.trim() : undefined,
    };
    const validation = validateIncomeEntryInput(input);
    if (!validation.valid) {
      setActionState({ status: 'invalid', errors: validation.errors });
      return;
    }
    setActionState({ status: 'saving' });
    const result = await onSave(entry.id, input);
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
    const result = await onDelete(entry.id);
    if (result === 'busy') {
      setActionState({ status: 'error', message: '다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.' });
    } else if (result === 'error') {
      setActionState({ status: 'error', message: '삭제하지 못했습니다. 다시 시도해주세요.' });
    }
  }

  return (
    <RowCard>
      <SummaryRow onPress={onToggle}>
        <CategoryIconChip color={theme.primary} initial="수" size="compact" />
        <RowMain>
          <ItemText>{entry.item}</ItemText>
        </RowMain>
        <AmountText>+{formatCurrency(entry.amount)}</AmountText>
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
            autoCapitalize="none"
          />
          {errors.date ? <FieldError>{errors.date}</FieldError> : null}

          <FieldLabel>내용</FieldLabel>
          <FieldInput
            value={item}
            onChangeText={(value) => {
              setItem(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="예: 8월 급여"
          />
          {errors.item ? <FieldError>{errors.item}</FieldError> : null}

          <FieldLabel>금액</FieldLabel>
          <FieldInput
            value={amountText}
            onChangeText={(value) => {
              setAmountText(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="예: 3000000"
            keyboardType="numeric"
          />
          {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}

          <FieldLabel>비고 (선택)</FieldLabel>
          <FieldInput
            value={memo}
            onChangeText={(value) => {
              setMemo(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="메모"
          />

          {actionState.status === 'error' ? <FieldError>{actionState.message}</FieldError> : null}
          {actionState.status === 'success' ? (
            <StatusSuccessText>수입내역이 저장되었습니다.</StatusSuccessText>
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

// This row only ever appears nested inside a period's detail box (never
// standalone on the main screen), so it uses ExpenseEditRow's compact sizing
// directly rather than needing its own standalone/compact variant switch.
const SummaryRow = styled(Pressable)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 8px;
`;

const ItemText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
`;

const AmountText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.primary};
  font-family: ${(props) => props.theme.fontBold};
`;
