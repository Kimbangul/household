import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  canDeleteCategory,
  createCategory,
  isDuplicateCategoryName,
  reclassifyExpensesForDeletedCategory,
  validateCategoryInput,
  type CategoryInputField,
} from '../src/domain/categories';
import type { Category, Expense } from '../src/domain/types';
import { useFieldFormState } from '../src/hooks/useFieldFormState';
import { useRepository } from '../src/storage/RepositoryContext';
import { useDarkMode } from '../src/theme/DarkModeContext';
import { useAppColors, type AppColors } from '../src/theme/useAppColors';
import { generateId } from '../src/utils/generateId';

export default function SettingsScreen() {
  const repository = useRepository();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { errors, setErrors, submitStatus, setSubmitStatus, submittingRef, clearFieldError } =
    useFieldFormState<CategoryInputField>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      setSubmitStatus(null);

      Promise.all([repository.getCategories(), repository.getExpenses()])
        .then(([loadedCategories, loadedExpenses]) => {
          if (cancelled) {
            return;
          }
          setCategories(loadedCategories);
          setExpenses(loadedExpenses);
          setLoadError(false);
        })
        .catch((error) => {
          console.error('Failed to load categories', error);
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

  async function handleAddCategory() {
    const validation = validateCategoryInput({ name });
    const errors: Partial<Record<CategoryInputField, string>> = { ...validation.errors };
    if (validation.valid && isDuplicateCategoryName(name, categories)) {
      errors.name = '이미 있는 카테고리 이름입니다.';
    }
    setErrors(errors);
    setSubmitStatus(null);
    if (Object.keys(errors).length > 0 || submittingRef.current || isLoading || loadError) {
      return;
    }

    submittingRef.current = true;
    setIsSaving(true);
    try {
      const category = createCategory({ name }, generateId('category'));
      const next = [...categories, category];
      await repository.saveCategories(next);
      setCategories(next);
      setName('');
      setErrors({});
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to save category', error);
      setSubmitStatus('error');
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (submittingRef.current || isLoading || loadError) {
      return;
    }

    submittingRef.current = true;
    setDeleteError(false);
    try {
      // Reclassify expenses before removing the category itself: if the
      // second write fails, expenses are left correctly nulled-out (and the
      // category, still present, can simply be deleted again), rather than
      // the category vanishing while expenses still point at its id.
      const nextExpenses = reclassifyExpensesForDeletedCategory(expenses, category.id);
      await repository.saveExpenses(nextExpenses);
      setExpenses(nextExpenses);

      const nextCategories = categories.filter((existing) => existing.id !== category.id);
      await repository.saveCategories(nextCategories);
      setCategories(nextCategories);
    } catch (error) {
      console.error('Failed to delete category', error);
      setDeleteError(true);
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>화면 설정</Text>
      <View style={styles.row}>
        <Text style={styles.rowText}>다크 모드</Text>
        <Switch value={isDarkMode} onValueChange={() => toggleDarkMode()} />
      </View>

      <Text style={[styles.heading, styles.sectionHeading]}>카테고리 관리</Text>

      <Text style={styles.label}>새 카테고리</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(value) => {
          setName(value);
          clearFieldError('name');
        }}
        placeholder="예: 반려동물"
        placeholderTextColor={colors.textMuted}
      />
      {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

      <Pressable
        style={styles.submitButton}
        onPress={handleAddCategory}
        disabled={isSaving || isLoading || loadError}
      >
        <Text style={styles.submitButtonText}>{isSaving ? '추가 중...' : '카테고리 추가'}</Text>
      </Pressable>

      {submitStatus === 'success' ? (
        <Text style={styles.statusSuccess}>카테고리가 추가되었습니다.</Text>
      ) : null}
      {submitStatus === 'error' ? (
        <Text style={styles.statusError}>처리하지 못했습니다. 다시 시도해주세요.</Text>
      ) : null}

      <Text style={[styles.heading, styles.sectionHeading]}>전체 카테고리</Text>
      {deleteError ? <Text style={styles.error}>삭제하지 못했습니다. 다시 시도해주세요.</Text> : null}
      {isLoading ? null : loadError ? (
        <Text style={styles.error}>카테고리를 불러오지 못했습니다.</Text>
      ) : (
        categories.map((category) => (
          <View key={category.id} style={styles.row}>
            <Text style={styles.rowText}>{category.name}</Text>
            {canDeleteCategory(category) ? (
              <Pressable onPress={() => handleDeleteCategory(category)}>
                <Text style={styles.deleteText}>삭제</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
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
    rowText: { fontSize: 16, color: colors.text },
    deleteText: { color: colors.danger },
  });
}
