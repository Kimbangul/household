import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

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
import {
  FieldError,
  FieldInput,
  FieldLabel,
  Screen,
  SectionHeading,
  StatusErrorText,
  StatusSuccessText,
  SubmitButton,
  SubmitButtonText,
  Heading,
} from '../src/theme/styledPrimitives';
import { generateId } from '../src/utils/generateId';

const CONTENT_CONTAINER_STYLE = { padding: 16, gap: 4 };

export default function SettingsScreen() {
  const repository = useRepository();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const theme = useTheme();
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
    <Screen contentContainerStyle={CONTENT_CONTAINER_STYLE}>
      <Heading>화면 설정</Heading>
      <Row>
        <RowText>다크 모드</RowText>
        <Switch value={isDarkMode} onValueChange={() => toggleDarkMode()} />
      </Row>

      <SectionHeading>카테고리 관리</SectionHeading>

      <FieldLabel>새 카테고리</FieldLabel>
      <FieldInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          clearFieldError('name');
        }}
        placeholder="예: 반려동물"
        placeholderTextColor={theme.textMuted}
      />
      {errors.name ? <FieldError>{errors.name}</FieldError> : null}

      <SubmitButton onPress={handleAddCategory} disabled={isSaving || isLoading || loadError}>
        <SubmitButtonText>{isSaving ? '추가 중...' : '카테고리 추가'}</SubmitButtonText>
      </SubmitButton>

      {submitStatus === 'success' ? <StatusSuccessText>카테고리가 추가되었습니다.</StatusSuccessText> : null}
      {submitStatus === 'error' ? (
        <StatusErrorText>처리하지 못했습니다. 다시 시도해주세요.</StatusErrorText>
      ) : null}

      <SectionHeading>전체 카테고리</SectionHeading>
      {deleteError ? <FieldError>삭제하지 못했습니다. 다시 시도해주세요.</FieldError> : null}
      {isLoading ? null : loadError ? (
        <FieldError>카테고리를 불러오지 못했습니다.</FieldError>
      ) : (
        categories.map((category) => (
          <Row key={category.id}>
            <RowText>{category.name}</RowText>
            {canDeleteCategory(category) ? (
              <Pressable onPress={() => handleDeleteCategory(category)}>
                <DeleteText>삭제</DeleteText>
              </Pressable>
            ) : null}
          </Row>
        ))
      )}
    </Screen>
  );
}

const Row = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.border};
`;

const RowText = styled.Text`
  font-size: 12px;
  line-height: 24px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
`;

const DeleteText = styled.Text`
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;
