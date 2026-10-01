import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Path, Polygon, RadialGradient, Stop } from "react-native-svg";
import type { AvatarSpec, AvatarStage } from "../lib/types";
import { STAGE_COLORS } from "./theme";

const STAGE_INDEX: Record<AvatarStage, number> = { spark: 0, ember: 1, forge: 2, titan: 3 };

/**
 * The evolving Forge avatar. Generated SVG (original artwork) that visibly
 * levels up with XP stage: spark → ember → forge → titan.
 * More aura rings, a bigger flame, armor accents, and finally a crown.
 */
export function AvatarFigure({
  spec,
  stage,
  size = 96,
}: {
  spec: AvatarSpec;
  stage: AvatarStage;
  size?: number;
}) {
  const idx = STAGE_INDEX[stage];
  const pal = STAGE_COLORS[stage];
  const skin = spec.skin;
  const accent = spec.color;
  const flameScale = [0.75, 1.0, 1.25, 1.5][idx];
  const gid = `g${stage}${size}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <RadialGradient id={`${gid}-bg`} cx="50%" cy="42%" r="65%">
          <Stop offset="0%" stopColor={pal.glow} stopOpacity={0.85} />
          <Stop offset="70%" stopColor={pal.dim} stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#12141A" stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Circle cx={60} cy={60} r={56} fill={`url(#${gid}-bg)`} />

      {/* aura rings */}
      {idx >= 1 && (
        <Circle cx={60} cy={60} r={50} fill="none" stroke={pal.main} strokeOpacity={0.5} strokeWidth={2} />
      )}
      {idx >= 2 && (
        <Circle cx={60} cy={60} r={44} fill="none" stroke={accent} strokeOpacity={0.65} strokeWidth={2.5} strokeDasharray="6 5" />
      )}
      {idx >= 3 && (
        <Circle cx={60} cy={60} r={54} fill="none" stroke="#FFF3D6" strokeOpacity={0.8} strokeWidth={1.5} strokeDasharray="2 6" />
      )}

      {/* torso */}
      <Path
        d="M42 104 C42 88 50 78 60 78 C70 78 78 88 78 104 Z"
        fill={skin}
        opacity={0.92}
      />
      {/* shoulders / armor at forge+ */}
      {idx >= 2 && (
        <>
          <Path d="M38 92 L48 82 L44 96 Z" fill={accent} opacity={0.9} />
          <Path d="M82 92 L72 82 L76 96 Z" fill={accent} opacity={0.9} />
        </>
      )}
      {/* head */}
      <Circle cx={60} cy={64} r={13} fill={skin} />
      {/* eyes */}
      <Circle cx={55.5} cy={63} r={1.8} fill="#14100B" />
      <Circle cx={64.5} cy={63} r={1.8} fill="#14100B" />

      {/* flame hair — grows with stage */}
      <g transform={`translate(60 44) scale(${flameScale})`}>
        <Path
          d="M0 -22 C 10 -12, 12 -2, 6 6 C 14 -2, 10 -16, 2 -24 C -2 -14, -12 -12, -8 0 C -14 -6, -12 -16, -4 -22 C -2 -18, 2 -18, 0 -22 Z"
          fill={pal.main}
        />
        {idx >= 1 && (
          <Path d="M0 -14 C 5 -8, 6 -2, 2 3 C 6 -2, 4 -10, 0 -14 Z" fill="#FFF3D6" opacity={0.9} />
        )}
        {idx >= 3 && (
          <Path d="M-14 -6 L-18 -14 L-10 -10 Z M14 -6 L18 -14 L10 -10 Z" fill="#FFF3D6" />
        )}
      </g>

      {/* titan crown */}
      {idx >= 3 && (
        <Polygon
          points="44,34 48,22 54,30 60,20 66,30 72,22 76,34"
          fill={accent}
          stroke="#FFF3D6"
          strokeWidth={1}
        />
      )}

      {/* sparkles at ember+ */}
      {idx >= 1 && (
        <>
          <Polygon points="30,40 32,46 38,48 32,50 30,56 28,50 22,48 28,46" fill={pal.main} opacity={0.8} />
          <Polygon points="90,40 92,46 98,48 92,50 90,56 88,50 82,48 88,46" fill={pal.main} opacity={0.8} />
        </>
      )}
    </Svg>
  );
}

/** Avatar with optional uploaded photo; falls back to the evolving SVG figure. */
export function Avatar({
  spec,
  stage,
  photoUri,
  size = 96,
}: {
  spec: AvatarSpec;
  stage: AvatarStage;
  photoUri?: string;
  size?: number;
}) {
  if (photoUri) {
    const pal = STAGE_COLORS[stage];
    return (
      <View
        style={[
          styles.photoWrap,
          { width: size, height: size, borderRadius: size / 2, borderColor: pal.main, borderWidth: Math.max(2, size / 28) },
        ]}
      >
        <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%", borderRadius: size / 2 }} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size }}>
      <AvatarFigure spec={spec} stage={stage} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: { overflow: "hidden", backgroundColor: "#1F232D" },
});
