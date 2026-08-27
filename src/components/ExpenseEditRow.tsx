import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { resolveCategoryLabel } from '../domain/categoryLookup';
import { formatCurrency } from '../domain/currency';
import { validateExpenseInput, type ExpenseInput, type ExpenseInputField } from '../domain/expense';
import type { Category, Expense } from '../domain/types';
import { useAppColors, type AppColors } from '../theme/useAppColors';
import { parseDigitAmount } from '../utils/parseDigitAmount';
import { CategoryChipPicker } from './CategoryChipPicker';

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
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  return (
    <View>
      <Pressable style={isCompact ? styles.rowCompact : styles.rowStandalone} onPress={onToggle}>
        <View style={styles.rowMain}>
          <Text style={isCompact ? styles.itemCompact : styles.itemStandalone}>{expense.item}</Text>
          <Text style={styles.meta}>
            {expense.date} · {resolveCategoryLabel(expense.categoryId, categoryNames)}
          </Text>
        </View>
        <Text style={isCompact ? styles.amountCompact : styles.amountStandalone}>
          {formatCurrency(expense.amount)}
        </Text>
      </Pressable>
      {isExpanded ? (
        <View style={styles.editForm}>
          <Text style={styles.label}>날짜</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={(value) => {
              setDate(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {errors.date ? <Text style={styles.fieldError}>{errors.date}</Text> : null}

          <Text style={styles.label}>품목</Text>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(value) => {
              setItem(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="예: 점심"
            placeholderTextColor={colors.textMuted}
          />
          {errors.item ? <Text style={styles.fieldError}>{errors.item}</Text> : null}

          <Text style={styles.label}>금액</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={(value) => {
              setAmountText(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="예: 12000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          {errors.amount ? <Text style={styles.fieldError}>{errors.amount}</Text> : null}

          <Text style={styles.label}>카테고리</Text>
          <CategoryChipPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setActionState({ status: 'idle' });
            }}
          />
          {errors.categoryId ? <Text style={styles.fieldError}>{errors.categoryId}</Text> : null}

          <Text style={styles.label}>비고 (선택)</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={(value) => {
              setMemo(value);
              setActionState({ status: 'idle' });
            }}
            placeholder="메모"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          {actionState.status === 'error' ? (
            <Text style={styles.fieldError}>{actionState.message}</Text>
          ) : null}
          {actionState.status === 'success' ? (
            <Text style={styles.statusSuccess}>지출내역이 저장되었습니다.</Text>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.saveButton} onPress={handleSave} disabled={isBusy}>
              <Text style={styles.saveButtonText}>
                {actionState.status === 'saving' ? '저장 중...' : '저장'}
              </Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={isBusy}>
              <Text style={styles.deleteButtonText}>
                {actionState.status === 'deleting' ? '삭제 중...' : '삭제'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    rowStandalone: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowCompact: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    rowMain: { flexShrink: 1, flexGrow: 1 },
    itemStandalone: { fontSize: 16, color: colors.text },
    itemCompact: { fontSize: 14, color: colors.text },
    meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    amountStandalone: { fontSize: 16, fontWeight: '600', color: colors.text },
    amountCompact: { fontSize: 14, fontWeight: '600', color: colors.text },
    editForm: { paddingVertical: 12, gap: 4 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 8, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginTop: 4,
      color: colors.text,
    },
    memoInput: { minHeight: 60, textAlignVertical: 'top' },
    fieldError: { marginTop: 4, color: colors.danger },
    statusSuccess: { marginTop: 8, color: colors.success },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    saveButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
    deleteButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    deleteButtonText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
  });
}
