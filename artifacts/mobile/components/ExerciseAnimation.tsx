import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { C } from "./theme";

// Stylized animated exercise demo: a parametric stick figure rendered from
// Views only (works on iOS, Android, and react-native-web). Each movement
// archetype is a closed loop of pose keyframes; a single looping
// Animated.Value is interpolated into joint angles per frame.
//
// Pose params (angles in degrees, distances in figure units where 100u = size):
//   lean    torso tilt, 0 = upright, + = leaning forward (clockwise)
//   bob     vertical hip offset, + = down
//   thigh*  leg swing, 0 = straight down, + = forward
//   knee*   shin bend relative to thigh, + = heel toward butt
//   arm*    arm swing, 0 = hanging down, + = forward/up
//   elbow*  forearm bend, + = curling up
//   spread  lateral leg spread
//   hipY    base hip height
//   headTilt lateral head offset

type Pose = {
  lean: number;
  bob: number;
  thighL: number;
  thighR: number;
  kneeL: number;
  kneeR: number;
  armL: number;
  armR: number;
  elbowL: number;
  elbowR: number;
  spread: number;
  hipY: number;
  headTilt: number;
};

const DEFAULT_POSE: Pose = {
  lean: 0,
  bob: 0,
  thighL: 0,
  thighR: 0,
  kneeL: 6,
  kneeR: 6,
  armL: 10,
  armR: -10,
  elbowL: 6,
  elbowR: 6,
  spread: 0,
  hipY: 62,
  headTilt: 0,
};

interface ArchetypeDef {
  duration: number;
  base?: Partial<Pose>;
  frames: Partial<Pose>[];
}

const ARCHETYPES: Record<string, ArchetypeDef> = {
  squat: {
    duration: 2000,
    frames: [{}, { lean: 22, bob: 17, thighL: 82, thighR: 82, kneeL: -78, kneeR: -78, armL: 65, armR: 65 }, {}],
  },
  pushup: {
    duration: 2200,
    base: { lean: 78, hipY: 44, thighL: -66, thighR: -66, kneeL: -4, kneeR: -4, armL: 6, armR: -6 },
    frames: [{}, { bob: 9, elbowL: 62, elbowR: 62, armL: 16, armR: 4 }, {}],
  },
  lunge: {
    duration: 2000,
    frames: [{}, { lean: 10, bob: 13, thighL: 55, thighR: -48, kneeL: -52, kneeR: 72, armL: 28, armR: -28 }, {}],
  },
  plank: {
    duration: 2600,
    base: { lean: 78, hipY: 44, thighL: -66, thighR: -66, kneeL: -4, kneeR: -4, armL: 4, armR: -4 },
    frames: [{}, { bob: 1.6 }, {}, { bob: -1.2 }, {}],
  },
  jumpingJack: {
    duration: 1400,
    frames: [{}, { armL: 152, armR: -152, spread: 9, bob: -4 }, {}],
  },
  mountainClimber: {
    duration: 1200,
    base: { lean: 76, hipY: 44, armL: 4, armR: -4 },
    frames: [{}, { thighL: 72, kneeL: -95 }, {}, { thighR: 72, kneeR: -95 }, {}],
  },
  crunch: {
    duration: 2000,
    base: { lean: 82, hipY: 74, thighL: -38, thighR: -38, kneeL: 78, kneeR: 78, armL: 42, armR: 42 },
    frames: [{}, { lean: 58, bob: -3, armL: 58, armR: 58 }, {}],
  },
  gluteBridge: {
    duration: 2200,
    base: { lean: 84, hipY: 72, thighL: -42, thighR: -42, kneeL: 82, kneeR: 82 },
    frames: [{}, { bob: -13, lean: 70, thighL: -58, thighR: -58 }, {}],
  },
  highKnees: {
    duration: 1000,
    frames: [
      {},
      { thighL: 85, kneeL: -100, armL: -35, armR: 45, bob: -2 },
      {},
      { thighR: 85, kneeR: -100, armL: 45, armR: -35, bob: -2 },
      {},
    ],
  },
  legRaise: {
    duration: 2000,
    base: { lean: 84, hipY: 74 },
    frames: [{}, { thighL: 76, thighR: 76, kneeL: -4, kneeR: -4 }, {}],
  },
  armCircles: {
    duration: 1600,
    base: { armL: 85, armR: -85 },
    frames: [{}, { armL: 102, armR: -68, bob: -1.5 }, {}, { armL: 68, armR: -102, bob: -1.5 }, {}],
  },
  legSwings: {
    duration: 1600,
    frames: [{ thighL: -32 }, { thighL: 52, kneeL: -8 }, { thighL: -32 }],
  },
  neckRolls: {
    duration: 2600,
    frames: [{}, { headTilt: 5, bob: 0.8 }, {}, { headTilt: -5, bob: 0.8 }, {}],
  },
  quadStretch: {
    duration: 2800,
    base: { thighR: -18, kneeR: 115, armR: -38, elbowR: 25 },
    frames: [{}, { bob: 1.2, lean: 2 }, {}, { bob: -1, lean: -2 }, {}],
  },
  childsPose: {
    duration: 3000,
    base: { lean: 55, hipY: 66, thighL: -55, thighR: -55, kneeL: 100, kneeR: 100, armL: 132, armR: 132 },
    frames: [{}, { lean: 60, bob: 2 }, {}, { lean: 51, bob: -1 }, {}],
  },
  row: {
    duration: 1800,
    base: { lean: 18, armL: 55, armR: 55, elbowL: 12, elbowR: 12 },
    frames: [{}, { armL: -18, armR: -18, elbowL: 72, elbowR: 72, lean: 12 }, {}],
  },
  pullup: {
    duration: 2000,
    base: { armL: 165, armR: -165, hipY: 60 },
    frames: [{}, { bob: -10, elbowL: 72, elbowR: 72, armL: 148, armR: -148 }, {}],
  },
  curl: {
    duration: 1600,
    base: { armL: 14, armR: -14 },
    frames: [{}, { elbowL: 105, elbowR: 105 }, {}],
  },
  hinge: {
    duration: 2000,
    frames: [{}, { lean: 48, bob: 4, thighL: 8, thighR: 8, kneeL: -10, kneeR: -10, armL: 38, armR: 38 }, {}],
  },
  burpee: {
    duration: 2600,
    frames: [
      {},
      { lean: 25, bob: 16, thighL: 80, thighR: 80, kneeL: -75, kneeR: -75, armL: 30, armR: 30 },
      { lean: 78, hipY: 46, thighL: -66, thighR: -66, kneeL: -4, kneeR: -4, armL: 6, armR: -6 },
      { lean: 25, bob: 16, thighL: 80, thighR: 80, kneeL: -75, kneeR: -75, armL: 30, armR: 30 },
      { bob: -8, armL: 150, armR: -150 },
      {},
    ],
  },
  calfRaise: {
    duration: 1600,
    frames: [{}, { bob: -3.5 }, {}],
  },
  bounce: {
    duration: 1800,
    frames: [{}, { bob: 3, armL: 18, armR: -18 }, {}],
  },
};

export default function ExerciseAnimation({
  archetype,
  size = 120,
  color = C.text,
}: {
  archetype: string;
  size?: number;
  color?: string;
}) {
  const def = ARCHETYPES[archetype] ?? ARCHETYPES.bounce;
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    t.setValue(0);
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: def.duration, easing: Easing.linear, useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [archetype, def.duration, t]);

  const u = size / 100;

  const frames = useMemo(() => {
    const merged = def.frames.map((f) => ({ ...DEFAULT_POSE, ...def.base, ...f }));
    merged.push(merged[0]); // close the loop for seamless looping
    return merged;
  }, [def]);

  const inputRange = frames.map((_, i) => i / (frames.length - 1));
  const deg = (key: keyof Pose) =>
    t.interpolate({ inputRange, outputRange: frames.map((f) => `${f[key]}deg`) });
  const dist = (key: keyof Pose) =>
    t.interpolate({ inputRange, outputRange: frames.map((f) => f[key] * u) });

  const lean = deg("lean");
  const thighL = deg("thighL");
  const thighR = deg("thighR");
  const kneeL = deg("kneeL");
  const kneeR = deg("kneeR");
  const armL = deg("armL");
  const armR = deg("armR");
  const elbowL = deg("elbowL");
  const elbowR = deg("elbowR");
  const headTilt = dist("headTilt");
  const spread = dist("spread");
  const hipY = Animated.add(dist("hipY"), dist("bob"));

  const hipX = size / 2;

  const leg = (
    thigh: Animated.AnimatedInterpolation<string>,
    knee: Animated.AnimatedInterpolation<string>,
    spreadX: Animated.AnimatedInterpolation<number>,
    dim: boolean,
    key: string,
  ) => (
    <Animated.View
      key={key}
      style={{
        position: "absolute",
        left: hipX - 2.75 * u,
        top: hipY,
        width: 5.5 * u,
        height: 0,
        opacity: dim ? 0.55 : 1,
        transform: [{ translateX: spreadX }, { rotate: thigh }],
      }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, width: 5.5 * u, height: 26 * u, borderRadius: 2.75 * u, backgroundColor: color }} />
      <Animated.View
        style={{ position: "absolute", top: 26 * u, left: 0.25 * u, width: 5 * u, height: 0, transform: [{ rotate: knee }] }}
      >
        <View style={{ position: "absolute", top: 0, left: 0, width: 5 * u, height: 24 * u, borderRadius: 2.5 * u, backgroundColor: color }} />
        <View style={{ position: "absolute", top: 22 * u, left: -1 * u, width: 10 * u, height: 4.5 * u, borderRadius: 2.25 * u, backgroundColor: color }} />
      </Animated.View>
    </Animated.View>
  );

  const arm = (
    angle: Animated.AnimatedInterpolation<string>,
    elbow: Animated.AnimatedInterpolation<string>,
    sideX: number,
    dim: boolean,
    key: string,
  ) => (
    <Animated.View
      key={key}
      style={{
        position: "absolute",
        bottom: 27 * u,
        left: sideX * u - 2.25 * u,
        width: 4.5 * u,
        height: 0,
        opacity: dim ? 0.55 : 1,
        transform: [{ rotate: angle }],
      }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, width: 4.5 * u, height: 22 * u, borderRadius: 2.25 * u, backgroundColor: color }} />
      <Animated.View
        style={{ position: "absolute", top: 22 * u, left: 0.25 * u, width: 4 * u, height: 0, transform: [{ rotate: elbow }] }}
      >
        <View style={{ position: "absolute", top: 0, left: 0, width: 4 * u, height: 20 * u, borderRadius: 2 * u, backgroundColor: color }} />
        <View style={{ position: "absolute", top: 19 * u, left: -1 * u, width: 6 * u, height: 6 * u, borderRadius: 3 * u, backgroundColor: color }} />
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={{ width: size, height: size }}>
      {/* ground shadow */}
      <View
        style={{
          position: "absolute",
          bottom: 1,
          left: size * 0.225,
          width: size * 0.55,
          height: size * 0.07,
          borderRadius: size * 0.035,
          backgroundColor: "#000",
          opacity: 0.3,
        }}
      />
      {/* back leg, then torso, then front leg */}
      {leg(thighR, kneeR, Animated.multiply(spread, -1), true, "legR")}
      <Animated.View
        style={{ position: "absolute", left: hipX, top: hipY, width: 0, height: 0, transform: [{ rotate: lean }] }}
      >
        <View
          style={{ position: "absolute", bottom: 0, left: -5.5 * u, width: 11 * u, height: 30 * u, borderRadius: 5.5 * u, backgroundColor: color }}
        />
        <Animated.View style={{ position: "absolute", bottom: 30 * u, left: -7.5 * u, transform: [{ translateX: headTilt }] }}>
          <View style={{ width: 15 * u, height: 15 * u, borderRadius: 7.5 * u, backgroundColor: color }} />
        </Animated.View>
        {arm(armR, elbowR, -2.5, true, "armR")}
        {arm(armL, elbowL, 2.5, false, "armL")}
      </Animated.View>
      {leg(thighL, kneeL, spread, false, "legL")}
    </View>
  );
}
