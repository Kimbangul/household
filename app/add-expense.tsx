import { StyleSheet, Text, View } from 'react-native';

export default function AddExpenseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>지출내역 추가</Text>
      <Text style={styles.subtitle}>추후 구현 예정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { marginTop: 8, color: '#888' },
});
