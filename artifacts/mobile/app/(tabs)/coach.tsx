import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { C } from "../../components/theme";
import { Body, Button, Card, Chip, EmptyState, Muted, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { coachReply, planMeals, planRunProgression, suggestWorkoutDraft } from "../../lib/ai";
import { occupationAdaptation } from "../../lib/engine";
import { uid } from "../../lib/format";
import { useForge } from "../../lib/store";
import { MEDICAL_DISCLAIMER, PERSONA_LABELS, type Draft } from "../../lib/types";

function contextSummary(): string {
  const s = useForge.getState();
  const last = s.workoutSessions[0];
  return [
    `name=${s.profile.name}, goal=${s.profile.goalDetail}, level=${s.profile.fitnessLevel}`,
    `work=${s.occupation.workType} ${s.occupation.hoursPerDay}h/d, injuries=${s.profile.injuries || "none"}`,
    `last workout=${last ? `${last.title} rated ${last.difficulty ?? "unrated"}` : "none"}`,
    `runs logged=${s.runSessions.length}, streak xp=${s.avatar.xp}`,
  ].join("; ");
}

export default function Coach() {
  const s = useForge();
  const sendChat = useForge((x) => x.sendChat);
  const addDraft = useForge((x) => x.addDraft);
  const acceptDraft = useForge((x) => x.acceptDraft);
  const discardDraft = useForge((x) => x.discardDraft);
  const updateSettings = useForge((x) => x.updateSettings);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    try {
      const r = await coachReply(text, contextSummary(), s.settings.coachPersona);
      sendChat(text, r.text, r.source);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setBusy(false);
    }
  };

  const makeDraft = async (kind: "workout" | "meals" | "run") => {
    setDraftBusy(kind);
    try {
      const st = useForge.getState();
      if (kind === "workout") {
        const lvl = st.profile.fitnessLevel === "beginner" ? 1 : st.profile.fitnessLevel === "intermediate" ? 2 : 3;
        const r = await suggestWorkoutDraft({
          focus: "full",
          minutes: 30,
          level: lvl as 1 | 2 | 3,
          equipment: st.equipment,
          injuries: st.profile.injuries,
          occupationNote: occupationAdaptation(st.occupation),
        });
        if (r.ok) {
          const d: Omit<Draft, "id" | "createdAt"> = {
            kind,
            title: r.data.title,
            summary: `${r.data.blocks.length} exercises · ~30 min · ${r.data.level} · ${r.source}`,
            payload: { ...r.data, id: uid("wp"), createdAt: new Date().toISOString() },
            source: r.source,
          };
          addDraft(d);
        }
      } else if (kind === "meals") {
        const scan = st.groceryScans[0];
        const ingredients = scan ? scan.ingredients.map((i) => i.name) : ["eggs", "oats", "chicken breast", "rice", "broccoli"];
        const r = await planMeals(ingredients, st.dietary.diet, st.dietary.allergies);
        if (r.ok) {
          addDraft({
            kind,
            title: "Suggested menu",
            summary: `${r.data.length} meals · from ${scan ? "your last scan" : "pantry staples"} · ${r.source}`,
            payload: { date: new Date().toISOString(), meals: r.data, source: r.source },
            source: r.source,
          });
        }
      } else {
        const longest = st.runSessions.reduce((n, x) => Math.max(n, x.distanceKm), 0);
        const r = await planRunProgression("5k", longest, 3);
        if (r.ok) {
          addDraft({
            kind,
            title: r.data.title,
            summary: `${r.data.weeks.length} weeks · 3 sessions/week · ${r.source}`,
            payload: { id: uid("rp"), goal: "5k" as const, currentWeek: 1, createdAt: new Date().toISOString(), ...r.data },
            source: r.source,
          });
        }
      }
    } finally {
      setDraftBusy(null);
    }
  };

  return (
    <Screen>
      <Title>Coach</Title>
      <Muted style={{ marginBottom: 12 }}>AI suggests — you decide.</Muted>

      <Row gap={8} style={{ marginBottom: 12 }}>
        {(Object.keys(PERSONA_LABELS) as (keyof typeof PERSONA_LABELS)[]).map((p) => (
          <Chip key={p} label={PERSONA_LABELS[p]} selected={s.settings.coachPersona === p} onPress={() => updateSettings({ coachPersona: p })} />
        ))}
      </Row>

      <SectionTitle>Drafts awaiting review</SectionTitle>
      {s.drafts.length === 0 ? (
        <Card>
          <Muted>No drafts. Ask for a new plan and review it here before it goes live.</Muted>
          <Row gap={8} style={{ marginTop: 12 }}>
            {(["workout", "meals", "run"] as const).map((k) => (
              <Button
                key={k}
                title={draftBusy === k ? "…" : `New ${k}`}
                variant="secondary"
                onPress={() => makeDraft(k)}
                style={{ flex: 1 }}
              />
            ))}
          </Row>
        </Card>
      ) : (
        <>
          {s.drafts.map((d) => (
            <Card key={d.id} style={{ borderColor: C.gold }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <Body style={{ fontWeight: "800", flex: 1 }}>{d.title}</Body>
                <Chip label={d.source === "ai" ? "AI draft" : "Template draft"} />
              </Row>
              <Muted style={{ marginBottom: 10 }}>{d.summary}</Muted>
              <Row gap={8}>
                <Button title="Accept" onPress={() => acceptDraft(d.id)} style={{ flex: 1 }} />
                <Button title="Discard" variant="ghost" onPress={() => discardDraft(d.id)} style={{ flex: 1 }} />
              </Row>
            </Card>
          ))}
          <Row gap={8} style={{ marginTop: 4 }}>
            {(["workout", "meals", "run"] as const).map((k) => (
              <Button
                key={k}
                title={draftBusy === k ? "…" : `New ${k}`}
                variant="secondary"
                onPress={() => makeDraft(k)}
                style={{ flex: 1 }}
              />
            ))}
          </Row>
        </>
      )}

      <SectionTitle>Chat</SectionTitle>
      <Card>
        <ScrollView ref={scrollRef} style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {s.chat.map((m) => (
            <View key={m.id} style={[styles.msg, m.role === "user" ? styles.user : styles.coach]}>
              <Text style={[styles.msgText, m.role === "user" && { color: "#14100B" }]}>{m.text}</Text>
              {m.source === "template" && m.role === "coach" && (
                <Text style={styles.srcTag}>offline coach</Text>
              )}
            </View>
          ))}
          {busy && (
            <View style={[styles.msg, styles.coach]}>
              <Text style={styles.msgText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>
        <Row gap={8} style={{ marginTop: 12 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={C.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Button title="Send" onPress={send} disabled={!input.trim() || busy} />
        </Row>
      </Card>

      <Card style={{ marginTop: 4 }}>
        <Muted>⚕️ {MEDICAL_DISCLAIMER}</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  msg: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: "88%" },
  user: { backgroundColor: C.accent, alignSelf: "flex-end" },
  coach: { backgroundColor: C.surface2, alignSelf: "flex-start", borderWidth: 1, borderColor: C.border },
  msgText: { color: C.text, fontSize: 14, lineHeight: 20 },
  srcTag: { color: C.muted, fontSize: 10, marginTop: 6, fontStyle: "italic" },
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
