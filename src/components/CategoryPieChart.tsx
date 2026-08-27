import Svg, { Path } from 'react-native-svg';
import styled from 'styled-components/native';

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
  const sliceColors = buildColorMap(stats);

  return (
    <Container>
      <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
        {stats.map((stat, index) => (
          <Path
            key={keyFor(stat)}
            d={describeArcPath(RADIUS, RADIUS, angles[index].startAngle, angles[index].endAngle)}
            fill={sliceColors.get(keyFor(stat))}
          />
        ))}
      </Svg>
      <Legend>
        {stats.map((stat) => (
          <LegendRow key={keyFor(stat)}>
            <LegendSwatch $color={sliceColors.get(keyFor(stat)) ?? UNCATEGORIZED_COLOR} />
            <LegendLabel>{stat.label}</LegendLabel>
            <LegendValue>
              {formatCurrency(stat.amount)} ({stat.percentage.toFixed(1)}%)
            </LegendValue>
          </LegendRow>
        ))}
      </Legend>
    </Container>
  );
}

const Container = styled.View`
  margin-top: 12px;
  margin-bottom: 4px;
  align-items: center;
  gap: 12px;
`;

const Legend = styled.View`
  width: 100%;
  gap: 6px;
`;

const LegendRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const LegendSwatch = styled.View<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${(props) => props.$color};
`;

const LegendLabel = styled.Text`
  flex: 1;
  font-size: 13px;
  color: ${(props) => props.theme.text};
`;

const LegendValue = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textMuted};
`;
