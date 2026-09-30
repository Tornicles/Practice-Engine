import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { C } from "../../components/theme";

const TABS: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: "index", title: "Today", icon: "flame" },
  { name: "train", title: "Train", icon: "barbell" },
  { name: "fuel", title: "Fuel", icon: "nutrition" },
  { name: "run", title: "Run", icon: "walk" },
  { name: "progress", title: "Progress", icon: "stats-chart" },
  { name: "coach", title: "Coach", icon: "chatbubble-ellipses" },
  { name: "profile", title: "Profile", icon: "person" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: "#12141A",
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={t.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
