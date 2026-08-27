import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '../domain/types';
import { useAppColors, type AppColors } from '../theme/useAppColors';

export function CategoryChipPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.categoryList}>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          onPress={() => onSelect(category.id)}
          style={[styles.categoryChip, selectedId === category.id && styles.categoryChipSelected]}
        >
          <Text
            style={[styles.categoryChipText, selectedId === category.id && styles.categoryChipTextSelected]}
          >
            {category.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    categoryChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryChipText: { color: colors.text },
    categoryChipTextSelected: { color: colors.onPrimary },
  });
}
