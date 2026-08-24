import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../src/domain/currency';
import { getRecentExpenses } from '../src/domain/recentExpenses';
import type { Category, Expense } from '../src/domain/types';
import { useRepository } from '../src/storage/RepositoryContext';

const RECENT_EXPENSE_LIMIT = 20;

export default function MainScreen() {
  const repository = useRepository();
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);

      Promise.all([repository.getExpenses(), repository.getCategories()])
        .then(([expenses, categories]) => {
          if (cancelled) {
            return;
          }
          setRecentExpenses(getRecentExpenses(expenses, RECENT_EXPENSE_LIMIT));
          setCategoryNames(
            categories.reduce<Record<string, string>>((names, category: Category) => {
              names[category.id] = category.name;
              return names;
            }, {}),
          );
          setLoadError(false);
        })
        .catch((error) => {
          console.error('Failed to load recent expenses', error);
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
    }, [repository]),
  );

  function categoryLabel(categoryId: string | null): string {
    if (!categoryId) {
      return '미분류';
    }
    return categoryNames[categoryId] ?? '미분류';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>최근 지출</Text>
      {isLoading ? null : loadError ? (
        <Text style={styles.error}>지출내역을 불러오지 못했습니다.</Text>
      ) : recentExpenses.length === 0 ? (
        <Text style={styles.empty}>아직 등록된 지출내역이 없습니다.</Text>
      ) : (
        <FlatList
          data={recentExpenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.item}>{item.item}</Text>
                <Text style={styles.meta}>
                  {item.date} · {categoryLabel(item.categoryId)}
                </Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#888' },
  error: { color: '#d33' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowMain: { flexShrink: 1 },
  item: { fontSize: 16 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
});
