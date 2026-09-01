import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Switch } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import { CategoryIconChip } from '../src/components/CategoryIconChip';
import { CloseIcon } from '../src/components/icons/ActionIcons';
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
import { getCategoryChipColor, getCategoryInitial } from '../src/theme/categoryChip';
import { useDarkMode } from '../src/theme/DarkModeContext';
import {
  Badge,
  Card,
  CARD_RADIUS,
  DeleteIconButton,
  dividerBottom,
  FieldError,
  FieldInput,
  FieldLabel,
  Heading,
  ListCard,
  Screen,
  SectionHeading,
  StatusErrorText,
  StatusSuccessText,
  SubmitButton,
  SubmitButtonText,
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
      <SpacedListCard>
        <Row $last>
          <RowText>다크 모드</RowText>
          <Switch
            value={isDarkMode}
            onValueChange={() => toggleDarkMode()}
            trackColor={{ true: theme.primary, false: theme.chipSurface }}
            thumbColor="#ffffff"
          />
        </Row>
      </SpacedListCard>

      <SectionHeading>카테고리 관리</SectionHeading>

      <Card>
        <FieldLabel>새 카테고리</FieldLabel>
        <FieldInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearFieldError('name');
          }}
          placeholder="예: 반려동물"
        />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}

        <SubmitButton onPress={handleAddCategory} disabled={isSaving || isLoading || loadError}>
          <SubmitButtonText>{isSaving ? '추가 중...' : '카테고리 추가'}</SubmitButtonText>
        </SubmitButton>

        {submitStatus === 'success' ? <StatusSuccessText>카테고리가 추가되었습니다.</StatusSuccessText> : null}
        {submitStatus === 'error' ? (
          <StatusErrorText>처리하지 못했습니다. 다시 시도해주세요.</StatusErrorText>
        ) : null}
      </Card>

      <SectionHeading>전체 카테고리</SectionHeading>
      {deleteError ? <FieldError>삭제하지 못했습니다. 다시 시도해주세요.</FieldError> : null}
      {isLoading ? null : loadError ? (
        <FieldError>카테고리를 불러오지 못했습니다.</FieldError>
      ) : (
        <ListCard>
          <CountHeader>
            <CountHeaderText>전체 카테고리 ({categories.length})</CountHeaderText>
          </CountHeader>
          {categories.map((category, index) => (
            <Row key={category.id} $last={index === categories.length - 1}>
              <CategoryIconChip
                color={getCategoryChipColor(category.id)}
                initial={getCategoryInitial(category.name)}
                categoryId={category.id}
                size="compact"
              />
              <RowText>{category.name}</RowText>
              {canDeleteCategory(category) ? (
                <DeleteIconButton
                  onPress={() => handleDeleteCategory(category)}
                  accessibilityLabel={`${category.name} 카테고리 삭제`}
                >
                  <CloseIcon color={theme.danger} />
                </DeleteIconButton>
              ) : (
                <Badge $tone="muted">기본</Badge>
              )}
            </Row>
          ))}
        </ListCard>
      )}
    </Screen>
  );
}

const SpacedListCard = styled(ListCard)`
  margin-bottom: 8px;
`;

// Sits flush against ListCard's own rounded top corners (ListCard has no
// `overflow: hidden` — see the note on ComparisonBox in app/index.tsx — so
// this carries its own matching top radius instead).
const CountHeader = styled.View`
  padding-vertical: 12px;
  padding-horizontal: 16px;
  border-top-left-radius: ${CARD_RADIUS}px;
  border-top-right-radius: ${CARD_RADIUS}px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.border};
  background-color: ${(props) => props.theme.chipSurface};
`;

const CountHeaderText = styled.Text`
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontBold};
`;

const Row = styled.View<{ $last: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  padding-horizontal: 16px;
  ${dividerBottom}
`;

const RowText = styled.Text`
  flex: 1;
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontSemiBold};
`;
