import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, EmptyState, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { calorieTarget, proteinTarget } from "../../lib/engine";
import { dayKey, fmtDate } from "../../lib/format";
import { useForge } from "../../lib/store";
import type { DietKind, Ingredient } from "../../lib/types";
import { DIET_LABELS } from "../../lib/types";
import { extractGroceries, planMeals } from "../../lib/ai";
import { StyleSheet } from "react-native";

export default function Fuel() {
  const s = useForge();
  const addGroceryScan = useForge((x) => x.addGroceryScan);
  const saveMealPlan = useForge((x) => x.saveMealPlan);
  const updateDietary = useForge((x) => x.updateDietary);

  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [extractNote, setExtractNote] = useState<string>("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftMeals, setDraftMeals] = useState<{ name: string; ingredients: string[]; prepMin: number; calories?: number; proteinG?: number; tags: string[] }[] | null>(null);
  const [mealSource, setMealSource] = useState<"ai" | "template">("template");

  const kcal = s.dietary.calorieTarget ?? calorieTarget(s.profile, s.occupation);
  const protein = s.dietary.proteinTargetG ?? proteinTarget(s.profile);
  const todayKey = dayKey(new Date().toISOString());
  const mealsToday = s.mealPlans.find((m) => dayKey(m.date) === todayKey);
  const lastScan = s.groceryScans[0];

  const pickImage = async (camera: boolean) => {
    const fn = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await fn({ mediaTypes: ["images"], quality: 0.6 });
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    setPhotoUri(uri);
    setBusy(true);
    try {
      const r = await extractGroceries(uri);
      if (r.ok) {
        setIngredients(r.data.ingredients);
        setExtractNote(r.data.note);
      }
    } finally {
      setBusy(false);
    }
  };

  const addManual = () => {
    const v = manual.trim();
    if (!v) return;
    setIngredients((ing) => [...ing, { name: v }]);
    setManual("");
  };

  const removeIngredient = (i: number) =>
    setIngredients((ing) => ing.filter((_, x) => x !== i));

  const saveScan = () => {
    if (!ingredients.length) return;
    addGroceryScan({ ingredients, note: "Scan", visionUsed: !!photoUri, photoUri });
    setPhotoUri(undefined);
    setIngredients([]);
    setExtractNote("");
  };

  const generateMeals = async (from: Ingredient[]) => {
    if (!from.length) return;
    setBusy(true);
    try {
      const r = await planMeals(from.map((i) => i.name), s.dietary.diet, s.dietary.allergies, kcal);
      if (r.ok) {
        setDraftMeals(r.data);
        setMealSource(r.source);
      }
    } finally {
      setBusy(false);
    }
  };

  const acceptMeals = () => {
    if (!draftMeals) return;
    saveMealPlan({
      date: new Date().toISOString(),
      meals: draftMeals,
      source: mealSource === "ai" ? "ai" : "template",
    });
    setDraftMeals(null);
  };

  return (
    <Screen>
      <Title>Fuel</Title>
      <Muted style={{ marginBottom: 12 }}>Snap your groceries. Eat what's there.</Muted>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Body style={{ fontWeight: "800", fontSize: 22 }}>{kcal.toLocaleString()} kcal</Body>
            <Muted>Daily target · {s.occupation.workType} work</Muted>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Body style={{ fontWeight: "800", fontSize: 22 }}>{protein}g</Body>
            <Muted>Protein target</Muted>
          </View>
        </Row>
      </Card>

      <SectionTitle>Today's meals</SectionTitle>
      {mealsToday ? (
        <Card>
          {mealsToday.meals.map((m, i) => (
            <View key={i} style={{ marginBottom: i < mealsToday.meals.length - 1 ? 12 : 0 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Body style={{ fontWeight: "700", flex: 1 }}>{m.name}</Body>
                {m.tags.includes("template") && <Chip label="Template" />}
              </Row>
              <Muted>
                {m.ingredients.join(" · ")}
                {m.calories ? ` · ${m.calories} kcal` : ""}{m.proteinG ? ` · ${m.proteinG}g protein` : ""} · {m.prepMin} min
              </Muted>
            </View>
          ))}
          <Button title="Regenerate from groceries" variant="secondary" onPress={() => lastScan && generateMeals(lastScan.ingredients)} style={{ marginTop: 12 }} />
        </Card>
      ) : (
        <EmptyState
          title="No meals planned today"
          body="Scan your groceries or type what you have, and Forge builds the menu."
        />
      )}

      {draftMeals && (
        <Card style={{ borderColor: C.accent }}>
          <Body style={{ fontWeight: "800", marginBottom: 4 }}>
            Suggested menu {mealSource === "template" ? "(template)" : "(AI)"}
          </Body>
          <Muted style={{ marginBottom: 10 }}>AI suggests, you decide — review before saving.</Muted>
          {draftMeals.map((m, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <Body style={{ fontWeight: "700" }}>{m.name}</Body>
              <Muted>{m.ingredients.join(" · ")}{m.calories ? ` · ${m.calories} kcal` : ""} · {m.prepMin} min</Muted>
            </View>
          ))}
          <Row gap={8}>
            <Button title="Use this menu" onPress={acceptMeals} style={{ flex: 1 }} />
            <Button title="Discard" variant="ghost" onPress={() => setDraftMeals(null)} style={{ flex: 1 }} />
          </Row>
        </Card>
      )}

      <SectionTitle>Grocery scan</SectionTitle>
      <Card>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <Button title="📷 Take photo" variant="secondary" onPress={() => pickImage(true)} style={{ flex: 1 }} />
          <Button title="🖼️ Choose photo" variant="secondary" onPress={() => pickImage(false)} style={{ flex: 1 }} />
        </Row>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        )}
        {busy && <Muted>Reading your groceries…</Muted>}
        {extractNote ? <Muted style={{ marginBottom: 8 }}>{extractNote}</Muted> : null}

        {ingredients.map((ing, i) => (
          <Row key={i} style={{ justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Body>{ing.name}{ing.qty ? <Muted> · {ing.qty}</Muted> : null}</Body>
            <Pressable onPress={() => removeIngredient(i)} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={C.muted} />
            </Pressable>
          </Row>
        ))}

        <Row gap={8} style={{ marginTop: 10 }}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            placeholder="Type an ingredient…"
            placeholderTextColor={C.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={addManual}
          />
          <Button title="Add" variant="secondary" onPress={addManual} />
        </Row>

        {ingredients.length > 0 && (
          <Row gap={8} style={{ marginTop: 12 }}>
            <Button title="Save scan" onPress={saveScan} style={{ flex: 1 }} />
            <Button title="Make meals" variant="secondary" onPress={() => generateMeals(ingredients)} style={{ flex: 1 }} />
          </Row>
        )}
      </Card>

      {s.groceryScans.length > 0 && (
        <>
          <SectionTitle>Past scans</SectionTitle>
          {s.groceryScans.slice(0, 5).map((gs) => (
            <Card key={gs.id} style={{ paddingVertical: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>{gs.note ?? "Grocery scan"} · {fmtDate(gs.scannedAt)}</Body>
                  <Muted numberOfLines={2}>{gs.ingredients.map((i) => i.name).join(", ")}</Muted>
                </View>
                <Pressable onPress={() => generateMeals(gs.ingredients)} hitSlop={10}>
                  <Text style={{ color: C.accent, fontWeight: "700" }}>Meals →</Text>
                </Pressable>
              </Row>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Diet</SectionTitle>
      <Card>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {(Object.keys(DIET_LABELS) as DietKind[]).map((d) => (
            <Chip key={d} label={DIET_LABELS[d]} selected={s.dietary.diet === d} onPress={() => updateDietary({ diet: d })} style={{ marginBottom: 8 }} />
          ))}
        </Row>
        {s.dietary.allergies.length > 0 && (
          <Muted style={{ marginTop: 8 }}>Allergies: {s.dietary.allergies.join(", ")}</Muted>
        )}
        <Muted style={{ marginTop: 4 }}>Edit allergies and dislikes in Profile → Fuel.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: "100%", height: 180, borderRadius: 12, marginBottom: 10 },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
});
