# 20 — Nutrition Engines

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11), §5 System C
**Depends on:** Doc 17 (content standards, R6 nutrition boundaries, R7 claim boundaries, R8 AI boundaries), Doc 19 (V1 curriculum — meal guidance pairs with training phases)
**Engines covered:** 10 (Food Capture), 11 (Nutrition Planning), 12 (Lifestyle Adaptation)

> Nutrition adapts to the foods the user already eats. The system learns eating patterns; it does not prescribe diets, and it never infers calorie or macro targets from photos alone (Doc 17, R6).

---

## A. Engine 10 — Food Capture

### A.1 Three-step UX

**Step 1 — Photograph.** User takes or uploads a meal photo, optionally adds a description, and indicates portion size. Portion input is tap-based: S / M / L relative to *their* usual serving, plus optional grams. No photo required — description-only entries are first-class.

**Step 2 — Identify.** AI suggests foods and ingredients as a checklist. Each suggestion carries a confidence badge:

| Badge | Meaning | UI treatment |
|---|---|---|
| High | Model confident | Listed normally, pre-checked |
| Medium | Probable but ambiguous | Listed, unchecked, "tap to confirm" |
| Low / unsure | Cannot distinguish | Shown explicitly as "Not sure — is this X or Y?" with both options tappable; never silently guessed |

Rules: the user can confirm, edit, remove, or add any item. Nothing is stored as "confirmed" until the user confirms it. Unconfirmed AI labels stay `draft` and are never used for guidance. Uncertainty is always shown, never hidden.

**Step 3 — Personalize.** After confirmation, the user gets 1–3 suggestion cards, ordered by: familiar meals first, practical portion adjustments second, affordable alternatives third. Cards are suggestions, not prescriptions ("Adding a protein anchor to this lunch tends to help afternoon training" — never "eat X grams of Y"). Dismissing a card is one tap and feeds preference learning.

Response target: 3–15 s for image analysis under normal conditions (provider latency excepted); the photo upload itself returns instantly with a skeleton state.

### A.2 Data retained

- Confirmed foods (post-confirmation only)
- Meal timing (`eaten_at`, `meal_type`)
- User-entered quantities (S/M/L, grams where given)
- Preferences: dislikes, allergies, dietary restrictions, budget flag, household staples
- Optional photo history — retained only with explicit opt-in; deletable at any time (Engine 23)

Draft (unconfirmed) AI labels are retained max 30 days for model-quality review, then purged; they are never surfaced as user data.

---

## B. Engine 11 — Nutrition Planning

### B.1 Observation-period rules

- Default: days 1–14 are observation — the system watches and learns patterns.
- **But:** basic guidance is available from day 1 whenever the user asks. There is no waiting period for answering a question or flagging an obvious gap (e.g. no protein anchor at lunch three days running).
- After the observation window (or earlier on request), the user gets a lightweight "eating pattern summary": meal regularity, protein-anchor frequency, vegetable presence, hydration — descriptive, not diagnostic.

### B.2 Meal-guidance templates (reviewer-owned, `nutrition_note` type)

| Template (`content_id`) | Trigger | Content shape |
|---|---|---|
| `nut.protein-anchor-01` | Lunches without a protein anchor 3+ days | Explains the concept; suggests additions from the user's own confirmed foods |
| `nut.vegetable-add-01` | Low vegetable presence | One-addition ideas using household staples |
| `nut.hydration-01` | User reports afternoon slumps | Water timing around training, not medical advice |
| `nut.budget-protein-01` | Budget flag set | Cheapest protein anchors from regional food data |
| `nut.training-day-fuel-01` | Hard training day logged | Eat enough around training; familiar foods, slightly larger portions |

Templates reference the user's confirmed foods first, regional staples second, generic advice last. All templates go through the content lifecycle (Doc 17, §A.2) with dietitian review.

### B.3 Cost and regional handling

- `budget_flag` (onboarding) → suggestions prefer low-cost staples; never suggest premium products to budget users.
- `region` (onboarding) → staple list localized (rice/beans, ugali/sukuma, lentils/roti, etc. — reviewer-curated per region, not AI-invented).
- Household staples (user-entered) always outrank generic suggestions.

### B.4 Hard boundaries (Doc 17, R6 — restated as implementation rules)

1. **No calorie or macro targets inferred from photos alone.** Ever. Targets may only come from user-entered data or reviewer-approved templates, and only for standard-tier adults.
2. **Restricted groups — kids, pregnancy, ED-risk, medically complex — get templated, reviewer-approved guidance only.** No AI-generated nutrition suggestions, no targets, no observation-period exceptions. The UI shows the template content and a referral note where appropriate.
3. **Allergy / restriction conflicts:** if a suggestion conflicts with a recorded allergy or restriction, it is suppressed before display and the suppression is logged.
4. Nutrition content follows the same versioning and withdrawal rules as all content (Doc 17, §A.5) — a withdrawn `nutrition_note` is removed from future suggestions immediately.

---

## C. Engine 12 — Lifestyle Adaptation

Connects training and nutrition to the person's work and daily routine. Outputs feed the composer (Doc 18, §A.1 `history`/schedule inputs) and the notification engine.

### C.1 Occupation-aware adjustment table

| Signal | Training adjustment | Nutrition note |
|---|---|---|
| Office worker, long sedentary day | Keep planned session; ensure movement breaks fired (Doc 19, §F) | `nut.training-day-fuel-01` if evening session is hard |
| Warehouse / manual worker, demanding shift (user-reported or schedule-tagged) | Lower-volume session: −30–40% volume, cap −1, mobility emphasis | Slightly larger familiar dinner; no targets |
| Athlete (e.g. soccer track), match day | Recovery session instead of training (mobility + easy movement) | Familiar carb-inclusive meal guidance via template |
| Shift worker, night shift | Sessions scheduled around sleep window; readiness check-in weighted toward sleep signal | Meal-timing guidance follows *their* day, not the clock |
| Travel day | Hotel/no-equipment variant set; session shortened to 15 min floor | Staple-based guidance; restaurant-decision template |

### C.2 Triggers

- Schedule change (Engine 4) → session duration and timing recalculated
- Occupation update (profile) → adjustment table re-applied from next plan
- Training-day feedback (missed / partial with "work ran long") → offer shorter sessions on similar weekdays going forward
- Daily planning run (overnight job) → tomorrow's plan pre-adjusted for known schedule tags

Adaptation is advisory and visible: the plan shows *why* it changed ("Shorter session — long shift yesterday"). Silent changes are a bug.

---

## D. Data model

```ts
// food_entries: one row per logged meal
food_entries {
  id uuid PK, user_id FK,
  photo_url text nullable, photo_retained bool default false,
  description text, portion_size text,          // S | M | L (+ grams in items where given)
  meal_type text,                               // breakfast | lunch | dinner | snack
  eaten_at timestamp, created_at timestamp,
  status text default 'draft'                   // draft | confirmed
}

// food_entry_items: confirmed (or candidate) foods within an entry
food_entry_items {
  id uuid PK, entry_id FK,
  label text, confidence text,                  // high | medium | low
  quantity_text text nullable,
  alternatives text[] default [],               // shown when unsure
  user_confirmed bool default false,
  user_edited bool default false
}

// meal_suggestions: guidance cards shown
meal_suggestions {
  id uuid PK, user_id FK, entry_id FK nullable,
  template_id text,                             // e.g. nut.protein-anchor-01 (+ version pin)
  title text, body text,
  status text default 'shown',                  // shown | accepted | dismissed
  created_at timestamp
}

// user_food_preferences: 1:1 with user
user_food_preferences {
  user_id FK PK,
  dislikes text[] default [], allergies text[] default [],
  dietary_restrictions text[] default [],
  budget_flag bool default false,
  household_staples text[] default [],
  region text
}
```

Relations: `food_entries` 1:N `food_entry_items`; `food_entries` 1:N `meal_suggestions`; `meal_suggestions.template_id` pins the `nutrition_note` version (Doc 17, §A.5).

Key queries:
- Pattern summary: aggregate `food_entry_items` (confirmed only) by `meal_type` over 14 days.
- Withdrawal: `UPDATE meal_suggestions SET status='withdrawn' WHERE template_id = $1 AND version < $2` for future-dated suggestions.

---

## E. AI boundaries for food vision (Doc 17, R8 — applied)

1. **Structured output only.** The vision model returns `{ items: [{ label, confidence, portion_estimate, alternatives[] }], overall_confidence }` against a reviewer-curated food label list. Free-text nutrition advice from the vision model is discarded.
2. **User confirmation required.** Nothing the model suggests becomes user data until confirmed (A.1). The UI makes draft-vs-confirmed visually distinct.
3. **Uncertainty surfaced, not smoothed.** Low-confidence items are shown as questions. The model is forbidden from picking a "most likely" label silently.
4. **No pixel-to-macro inference.** The model may describe *what* it sees; it may not estimate calories, protein, or any nutrient from the image.
5. **Restricted-group gate.** For kids, pregnancy, ED-risk, and medically complex users, AI suggestions are disabled entirely — templated content only (B.4.2). This is enforced in code, not in a prompt.
6. **Validation.** Every AI output is schema-validated before display; validation failures fall back to manual entry mode.

---

## F. Test scenarios

1. Photo of an ambiguous stew → UI shows "not sure" with alternatives; user picks; only the confirmed label is stored.
2. User photographs lunch 3 days with no protein anchor → `nut.protein-anchor-01` suggested once, using their own foods; dismissed → not shown again for 14 days.
3. Pregnant user logs a meal → no AI suggestions; templated guidance only; no targets anywhere in the UI.
4. User deletes photo history → photos purged, confirmed food labels retained (they're user data), draft labels purged.
5. AI provider down → manual entry mode; previously confirmed data fully usable; no guidance gap for templates.
6. Reviewer withdraws `nut.budget-protein-01` → removed from future suggestion runs; already-shown cards marked withdrawn.
7. Budget-flagged user → suggestions contain only low-cost staples; zero premium-product recommendations in 30 days of logs.

---

## Decision log

- **Confirmation is the data boundary.** Draft AI labels are not user data and are never used for guidance — this is what makes the uncertainty UI honest instead of decorative.
- **Observation without gatekeeping.** The 14-day window exists for pattern quality, but withholding obvious help for two weeks would be a worse product; guidance on request from day 1.
- **Templates, not generative advice.** Meal guidance is reviewer-owned content through the standard lifecycle — the same safety story as exercises (Doc 17).
- **Restricted-group gate in code.** Prompt-level instructions are not a safety boundary; the flag check happens before the vision model is even called.
- **Adaptation is visible.** Every lifestyle-driven plan change carries its reason; silent personalization erodes trust and hides bugs.

## Next

- **21 — Education & portfolio** (13–16): lesson delivery mechanics, knowledge assessment, mastery tracking, trainer-development pathway detail.
- **22 — Onboarding & scheduling** (1–4): question-per-screen flow, eligibility/consent, calendar + reminders.
- **23 — Performance assessments** (9): benchmark protocols and scoring rubrics per specialization (V1 detail beyond Doc 19, §D).
- **24 — Content studio admin** (17–20 tooling) · **25 — Platform operations** (21–24) · **26 — Technical consolidation** (§10).
