import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { buildExport } from "../../lib/export";
import { cancelReminders, scheduleDailyReminder } from "../../lib/notifications";
import { useForge } from "../../lib/store";
import type { AvatarStyle, DietKind, Equipment, EquipmentKey, FitnessGoal, FitnessLevel, Sex, WorkType } from "../../lib/types";
import {
  AVATAR_COLORS,
  AVATAR_STYLE_LABELS,
  DIET_LABELS,
  EQUIPMENT_LABELS,
  FITNESS_LEVEL_LABELS,
  GOAL_LABELS,
  MEDICAL_DISCLAIMER,
  SEX_LABELS,
  WORK_TYPE_LABELS,
} from "../../lib/types";

function Field({ value, onChange, placeholder, numeric, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      style={[styles.input, multiline && { minHeight: 70, textAlignVertical: "top" }]}
    />
  );
}

export default function Profile() {
  const s = useForge();
  const updateProfile = useForge((x) => x.updateProfile);
  const updateOccupation = useForge((x) => x.updateOccupation);
  const updateEquipment = useForge((x) => x.updateEquipment);
  const updateDietary = useForge((x) => x.updateDietary);
  const updateSettings = useForge((x) => x.updateSettings);
  const setAvatarPhoto = useForge((x) => x.setAvatarPhoto);
  const resetAll = useForge((x) => x.resetAll);

  const [name, setName] = useState(s.profile.name);
  const [injuries, setInjuries] = useState(s.profile.injuries);
  const [goalDetail, setGoalDetail] = useState(s.profile.goalDetail);
  const [jobLabel, setJobLabel] = useState(s.occupation.label);
  const [hours, setHours] = useState(String(s.occupation.hoursPerDay));
  const [allergies, setAllergies] = useState(s.dietary.allergies.join(", "));
  const [dislikes, setDislikes] = useState(s.dietary.dislikes.join(", "));
  const [kcal, setKcal] = useState(s.dietary.calorieTarget ? String(s.dietary.calorieTarget) : "");
  const [exported, setExported] = useState(false);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setAvatarPhoto(res.assets[0].uri);
  };

  const toggleReminders = async (on: boolean) => {
    updateSettings({ reminders: on });
    if (on) {
      const ok = await scheduleDailyReminder(s.settings.reminderHour, s.settings.reminderMinute);
      if (!ok) Alert.alert("Reminders", "Notification permission was not granted.");
    } else {
      await cancelReminders();
    }
  };

  const doExport = async () => {
    const json = buildExport(useForge.getState());
    await Clipboard.setStringAsync(json);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const saveProfile = () => {
    updateProfile({ name: name.trim() || s.profile.name, injuries: injuries.trim(), goalDetail: goalDetail.trim() });
    updateOccupation({ label: jobLabel.trim(), hoursPerDay: Math.min(16, Math.max(1, parseInt(hours) || 8)) });
    updateDietary({
      allergies: allergies.split(",").map((x) => x.trim()).filter(Boolean),
      dislikes: dislikes.split(",").map((x) => x.trim()).filter(Boolean),
      calorieTarget: kcal ? parseInt(kcal) : undefined,
    });
    Alert.alert("Saved", "Your profile is updated.");
  };

  return (
    <Screen>
      <Title>Profile</Title>
      <Muted style={{ marginBottom: 12 }}>You, your work, your fuel.</Muted>

      <Card>
        <Row style={{ marginBottom: 12 }}>
          <Avatar spec={s.profile.avatar} stage={s.avatar.stage} photoUri={s.avatarPhotoUri} size={84} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Body style={{ fontWeight: "800", fontSize: 19 }}>{s.profile.name}</Body>
            <Muted>
              {GOAL_LABELS[s.profile.goal]} · {FITNESS_LEVEL_LABELS[s.profile.fitnessLevel]}
            </Muted>
            <Muted>
              {s.avatar.stage} · {s.avatar.xp} XP
            </Muted>
          </View>
        </Row>
        <Row gap={8}>
          <Button title={s.avatarPhotoUri ? "Change photo" : "Upload photo"} variant="secondary" onPress={pickPhoto} style={{ flex: 1 }} />
          {s.avatarPhotoUri && <Button title="Remove" variant="ghost" onPress={() => setAvatarPhoto(undefined)} style={{ flex: 1 }} />}
        </Row>
        <Muted style={{ marginTop: 12, marginBottom: 8 }}>Avatar style</Muted>
        <Row gap={8} style={{ marginBottom: 10 }}>
          {(Object.keys(AVATAR_STYLE_LABELS) as AvatarStyle[]).map((st) => (
            <Chip key={st} label={AVATAR_STYLE_LABELS[st]} selected={s.profile.avatar.style === st} onPress={() => updateProfile({ avatar: { ...s.profile.avatar, style: st } })} />
          ))}
        </Row>
        <Muted style={{ marginBottom: 8 }}>Skin tone</Muted>
        <Row gap={10} style={{ marginBottom: 10 }}>
          {["#f1c9a5", "#e0ac82", "#c98d64", "#a06a42", "#6f452b"].map((t) => (
            <Pressable key={t} onPress={() => updateProfile({ avatar: { ...s.profile.avatar, skin: t } })} style={[styles.swatch, { backgroundColor: t }, s.profile.avatar.skin === t && styles.swatchOn]} />
          ))}
        </Row>
        <Muted style={{ marginBottom: 8 }}>Accent</Muted>
        <Row gap={10} style={{ flexWrap: "wrap" }}>
          {AVATAR_COLORS.map((t) => (
            <Pressable key={t} onPress={() => updateProfile({ avatar: { ...s.profile.avatar, color: t } })} style={[styles.swatch, { backgroundColor: t }, s.profile.avatar.color === t && styles.swatchOn]} />
          ))}
        </Row>
      </Card>

      <SectionTitle>Basics</SectionTitle>
      <Card>
        <Muted>Name</Muted>
        <Field value={name} onChange={setName} placeholder="Your name" />
        <Muted style={styles.mt}>Sex</Muted>
        <Row gap={8} style={styles.mb}>
          {(Object.keys(SEX_LABELS) as Sex[]).map((x) => (
            <Chip key={x} label={SEX_LABELS[x]} selected={s.profile.sex === x} onPress={() => updateProfile({ sex: x })} />
          ))}
        </Row>
        <Muted>Goal</Muted>
        <Row gap={8} style={[styles.mb, { flexWrap: "wrap" }]}>
          {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
            <Chip key={g} label={GOAL_LABELS[g]} selected={s.profile.goal === g} onPress={() => updateProfile({ goal: g })} style={{ marginBottom: 6 }} />
          ))}
        </Row>
        <Muted>Goal detail</Muted>
        <Field value={goalDetail} onChange={setGoalDetail} multiline placeholder="e.g. Run 5K without stopping" />
        <Muted style={styles.mt}>Fitness level</Muted>
        <Row gap={8} style={styles.mb}>
          {(Object.keys(FITNESS_LEVEL_LABELS) as FitnessLevel[]).map((l) => (
            <Chip key={l} label={FITNESS_LEVEL_LABELS[l]} selected={s.profile.fitnessLevel === l} onPress={() => updateProfile({ fitnessLevel: l })} />
          ))}
        </Row>
        <Muted>Injuries / limitations</Muted>
        <Field value={injuries} onChange={setInjuries} multiline placeholder="e.g. sore right knee" />
      </Card>

      <SectionTitle>Work</SectionTitle>
      <Card>
        <Muted>Work type</Muted>
        <Row gap={8} style={[styles.mb, { flexWrap: "wrap" }]}>
          {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((w) => (
            <Chip key={w} label={WORK_TYPE_LABELS[w]} selected={s.occupation.workType === w} onPress={() => updateOccupation({ workType: w, shiftWork: w === "shift" })} style={{ marginBottom: 6 }} />
          ))}
        </Row>
        <Muted>Job label</Muted>
        <Field value={jobLabel} onChange={setJobLabel} placeholder="e.g. Nurse, night shift" />
        <Muted style={styles.mt}>Hours per day</Muted>
        <Field value={hours} onChange={setHours} numeric placeholder="8" />
        <Muted style={styles.mt}>Preferred training time</Muted>
        <Row gap={8} style={styles.mb}>
          {(["morning", "lunch", "evening"] as const).map((t) => (
            <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} selected={s.occupation.preferredTrainingTime === t} onPress={() => updateOccupation({ preferredTrainingTime: t })} />
          ))}
        </Row>
      </Card>

      <SectionTitle>Equipment</SectionTitle>
      <Card>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((k) => {
            const patch: Partial<Equipment> = { [k]: !s.equipment[k] };
            return (
              <Chip
                key={k}
                label={EQUIPMENT_LABELS[k]}
                selected={s.equipment[k]}
                onPress={() => updateEquipment(patch)}
                style={{ marginBottom: 8 }}
              />
            );
          })}
        </Row>
      </Card>

      <SectionTitle>Fuel</SectionTitle>
      <Card>
        <Muted>Diet</Muted>
        <Row gap={8} style={[styles.mb, { flexWrap: "wrap" }]}>
          {(Object.keys(DIET_LABELS) as DietKind[]).map((d) => (
            <Chip key={d} label={DIET_LABELS[d]} selected={s.dietary.diet === d} onPress={() => updateDietary({ diet: d })} style={{ marginBottom: 6 }} />
          ))}
        </Row>
        <Muted>Allergies (comma separated)</Muted>
        <Field value={allergies} onChange={setAllergies} placeholder="peanuts, shellfish" />
        <Muted style={styles.mt}>Dislikes</Muted>
        <Field value={dislikes} onChange={setDislikes} placeholder="mushrooms" />
        <Muted style={styles.mt}>Calorie target override (blank = auto)</Muted>
        <Field value={kcal} onChange={setKcal} numeric placeholder="e.g. 2200" />
        <Button title="Save all changes" onPress={saveProfile} style={{ marginTop: 14 }} />
      </Card>

      <SectionTitle>Settings</SectionTitle>
      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Body>Workout reminders</Body>
          <Chip label={s.settings.reminders ? "On" : "Off"} selected={s.settings.reminders} onPress={() => toggleReminders(!s.settings.reminders)} />
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          <Body>Units</Body>
          <Row gap={8}>
            <Chip label="Metric" selected={s.settings.units === "metric"} onPress={() => updateSettings({ units: "metric" })} />
            <Chip label="Imperial" selected={s.settings.units === "imperial"} onPress={() => updateSettings({ units: "imperial" })} />
          </Row>
        </Row>
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card>
        <Body style={{ fontWeight: "700", marginBottom: 4 }}>Export all my data</Body>
        <Muted style={{ marginBottom: 10 }}>One-tap full export as JSON. Your data is yours — take it anywhere.</Muted>
        <Button title={exported ? "Copied to clipboard ✓" : "Copy export JSON"} variant="secondary" onPress={doExport} />
      </Card>
      <Card>
        <Body style={{ fontWeight: "700", marginBottom: 4 }}>Reset demo data</Body>
        <Muted style={{ marginBottom: 10 }}>Restore Alex Rivera's seeded history.</Muted>
        <Button title="Reset" variant="danger" onPress={() => Alert.alert("Reset", "Restore demo data?", [{ text: "Cancel" }, { text: "Reset", style: "destructive", onPress: resetAll }])} />
      </Card>

      <Card>
        <Muted>⚕️ {MEDICAL_DISCLAIMER}</Muted>
        <Muted style={{ marginTop: 8 }}>Forge v1.0.0 · clean-room build · offline-first</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: C.text,
    fontSize: 15,
    marginTop: 4,
  },
  mt: { marginTop: 12 },
  mb: { marginBottom: 4, marginTop: 6 },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: C.text },
});
