import Svg, { Path } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';

import type { CategoryStat } from '../domain/categoryStats';
import { formatCurrency } from '../domain/currency';
import { computeSliceAngles, describeArcPath } from '../utils/pieSlices';

const CHART_SIZE = 160;
const RADIUS = CHART_SIZE / 2;
const UNCATEGORIZED_COLOR = '#adb5bd';

function keyFor(stat: CategoryStat): string {
  return stat.categoryId ?? 'uncategorized';
}

// A fixed-size palette runs out once a period spans more categories than it
// has colors (this app seeds 14 default categories), silently reusing colors
// for unrelated slices. Spacing hues evenly across however many real
// categories are present keeps every slice visually distinct regardless of
// count.
function buildColorMap(stats: CategoryStat[]): Map<string, string> {
  const categorized = stats.filter((stat) => stat.categoryId !== null);
  const hueStep = categorized.length === 0 ? 0 : 360 / categorized.length;

  const colors = new Map<string, string>();
  let colorIndex = 0;
  for (const stat of stats) {
    if (stat.categoryId === null) {
      colors.set(keyFor(stat), UNCATEGORIZED_COLOR);
    } else {
      colors.set(keyFor(stat), `hsl(${Math.round(colorIndex * hueStep)}, 65%, 55%)`);
      colorIndex += 1;
    }
  }
  return colors;
}

export function CategoryPieChart({ stats }: { stats: CategoryStat[] }) {
  if (stats.length === 0) {
    return null;
  }

  const angles = computeSliceAngles(stats.map((stat) => stat.percentage));
  const colors = buildColorMap(stats);

  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
        {stats.map((stat, index) => (
          <Path
            key={keyFor(stat)}
            d={describeArcPath(RADIUS, RADIUS, angles[index].startAngle, angles[index].endAngle)}
            fill={colors.get(keyFor(stat))}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        {stats.map((stat) => (
          <View key={keyFor(stat)} style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.get(keyFor(stat)) }]} />
            <Text style={styles.legendLabel}>{stat.label}</Text>
            <Text style={styles.legendValue}>
              {formatCurrency(stat.amount)} ({stat.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, marginBottom: 4, alignItems: 'center', gap: 12 },
  legend: { width: '100%', gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendSwatch: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 13 },
  legendValue: { fontSize: 13, color: '#555' },
});
