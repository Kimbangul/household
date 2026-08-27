import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '../domain/types';

export function CategoryChipPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
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

const styles = StyleSheet.create({
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
});
