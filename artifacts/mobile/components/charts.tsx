import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { C } from "./theme";

/** Simple SVG bar chart (no chart lib needed). */
export function BarChart({
  data,
  height = 120,
  color = C.accent,
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const W = 320;
  const H = height;
  const pad = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad * 2) / data.length;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {data.map((d, i) => {
          const bh = Math.max(3, ((H - pad - 18) * d.value) / max);
          const x = pad + i * bw + bw * 0.18;
          return (
            <Rect
              key={i}
              x={x}
              y={H - 18 - bh}
              width={bw * 0.64}
              height={bh}
              rx={4}
              fill={d.value > 0 ? color : C.surface2}
              opacity={d.value > 0 ? 1 : 0.7}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
      {formatValue ? (
        <View style={styles.labels}>
          {data.map((d, i) => (
            <Text key={`v-${i}`} style={[styles.label, { color: C.text, fontWeight: "700" }]} numberOfLines={1}>
              {d.value > 0 ? formatValue(d.value) : ""}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Readiness ring: 0–100 score as an SVG arc. */
export function ReadinessRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? C.green : score >= 45 ? C.gold : C.red;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.surface2} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.score, { fontSize: size / 4 }]}>{score}</Text>
      <Text style={styles.scoreLabel}>ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: "row", justifyContent: "space-around", marginTop: 2 },
  label: { color: C.muted, fontSize: 10, flex: 1, textAlign: "center" },
  score: { color: C.text, fontWeight: "800" },
  scoreLabel: { color: C.muted, fontSize: 11, marginTop: -2 },
});
