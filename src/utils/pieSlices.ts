export interface SliceAngles {
  startAngle: number;
  endAngle: number;
}

export function computeSliceAngles(percentages: number[]): SliceAngles[] {
  let cursor = 0;
  const slices = percentages.map((percentage) => {
    const startAngle = cursor;
    cursor += (percentage / 100) * 360;
    return { startAngle, endAngle: cursor };
  });

  if (slices.length > 0) {
    // Percentages are expected to sum to exactly 100, but repeated float
    // addition can drift by a few ULPs; snapping the last slice closes the
    // circle exactly instead of leaving an invisible-but-real seam.
    slices[slices.length - 1].endAngle = 360;
  }

  return slices;
}

// Angle 0 points straight up (12 o'clock) and increases clockwise, matching
// how a pie chart legend is usually read.
function pointOnCircle(center: number, radius: number, angleDegrees: number): { x: number; y: number } {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: round(center + radius * Math.cos(radians)),
    y: round(center + radius * Math.sin(radians)),
  };
}

// Rounds away the floating-point noise from Math.cos/sin (e.g. 6.12e-17
// instead of 0) so simple angles produce clean, deterministic path strings.
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function describeArcPath(center: number, radius: number, startAngle: number, endAngle: number): string {
  const sweep = endAngle - startAngle;

  if (sweep >= 360) {
    // A full circle has no visible seam, so there's no need to rotate the
    // split point to startAngle — a fixed left/right split keeps this simple.
    const left = { x: center - radius, y: center };
    const right = { x: center + radius, y: center };
    return `M ${left.x} ${left.y} A ${radius} ${radius} 0 1 1 ${right.x} ${right.y} A ${radius} ${radius} 0 1 1 ${left.x} ${left.y} Z`;
  }

  const start = pointOnCircle(center, radius, startAngle);
  const end = pointOnCircle(center, radius, endAngle);
  const largeArcFlag = sweep > 180 ? 1 : 0;
  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}
