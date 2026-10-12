# PRACTICE-ENGINE — Complete Build Prompt Roadmap

**Transcribed:** 2026-10-11 · **Source:** user's "COMPLETE BUILD PROMPT ROADMAP" brief (faithful transcription, not a redesign)

**Recommendation:** 100 structured development prompts, divided into 20 phases.

This covers the full application: 40 fitness specializations, 180-day mastery programs, exercise demonstrations, AI coaching, nutrition, learning, assessments, content creation, administration, subscriptions, and deployment.

The prompts should be executed against the existing Practice-Engine repository, not used to rebuild everything from scratch.

**Important:** 100 prompts is a planning estimate, not a guarantee. Each prompt must require working code, database changes where necessary, tests, and a verification report before proceeding.

---

## Phase 1 — Repository and System Architecture

| # | Prompt coverage |
|---|---|
| 1 | Audit the existing GitHub repository, identify working features, broken features, duplicate applications, and reusable components. |
| 2 | Define the final mobile, web, backend, database, and AI architecture. |
| 3 | Consolidate duplicate implementations without losing functional features. |
| 4 | Establish design system, navigation, reusable components, and mobile responsiveness. |
| 5 | Configure development environments, secrets, migrations, CI/CD, testing, and monitoring. |

## Phase 2 — Identity, Authentication, and Onboarding

| # | Prompt coverage |
|---|---|
| 6 | Registration, login, account recovery, and secure sessions. |
| 7 | User profiles, preferences, accessibility, language, and time zone. |
| 8 | Age verification, eligibility, guardian consent, and privacy permissions. |
| 9 | Fitness onboarding: goals, abilities, limitations, equipment, space, and schedule. |
| 10 | Baseline assessments, starting-level assignment, and personalized profile generation. |

## Phase 3 — Forty Fitness Specializations

| # | Prompt coverage |
|---|---|
| 11 | Create the eight fitness categories and 40-specialization catalog. |
| 12 | Build specialization selection, search, comparison, and enrollment. |
| 13 | Define competency maps, learning objectives, and prerequisites for every specialization. |
| 14 | Implement primary specialization, secondary goals, and compatible cross-specialization training. |
| 15 | Build specialization management, versioning, and eligibility restrictions. |

## Phase 4 — Exercise Library

| # | Prompt coverage |
|---|---|
| 16 | Create canonical exercise database, muscle groups, movement patterns, and equipment requirements. |
| 17 | Import, deduplicate, and organize the proposed 525 exercise entries and variations. |
| 18 | Add exercise instructions, sets, repetitions, tempo, rest, difficulty, and technique cues. |
| 19 | Implement exercise modifications, progressions, regressions, and safety restrictions. |
| 20 | Build exercise browsing, filtering, demonstration playback, and offline availability. |

## Phase 5 — Exercise Content Production

| # | Prompt coverage |
|---|---|
| 21 | Build exercise script and demonstration storyboard generation. |
| 22 | Create video upload, transcoding, compression, captioning, and thumbnail workflows. |
| 23 | Build exercise demonstration review and approval procedures. |
| 24 | Connect approved exercise media to workout sessions and lessons. |
| 25 | Implement content corrections, version control, replacement, and withdrawal. |

## Phase 6 — Workout Engine

| # | Prompt coverage |
|---|---|
| 26 | Build the AI-assisted workout composer using approved exercise records. |
| 27 | Create warm-ups, workout blocks, cooldowns, sets, repetitions, and rest scheduling. |
| 28 | Build interactive workout player with timers, video, audio, and exercise tracking. |
| 29 | Add exercise substitutions, skipped sessions, rescheduling, and offline workout execution. |
| 30 | Implement post-workout feedback, training history, and automatic workload adjustments. |

## Phase 7 — Recovery and Safety

| # | Prompt coverage |
|---|---|
| 31 | Create pre-workout readiness checks and recovery questionnaires. |
| 32 | Build training-load monitoring, fatigue flags, and recovery scheduling. |
| 33 | Implement injury-related restrictions, pain reporting, and stop-exercise pathways. |
| 34 | Add age-specific, prenatal, postpartum, and adaptive-fitness safeguards. |
| 35 | Build safety escalation, professional referral guidance, audit logging, and rule testing. |

## Phase 8 — Six-Month Mastery System

| # | Prompt coverage |
|---|---|
| 36 | Create 180-day curriculum framework and six monthly phases. |
| 37 | Build daily, weekly, and monthly training-plan generation. |
| 38 | Implement competency tracking and rank prerequisites. |
| 39 | Build monthly checkpoints, practical assessments, and reassessment workflows. |
| 40 | Create final mastery review, earned achievements, and program completion records. |

## Phase 9 — Performance Assessment

| # | Prompt coverage |
|---|---|
| 41 | Build baseline physical assessment templates for different specializations. |
| 42 | Implement strength, endurance, mobility, balance, speed, and agility assessment tracking. |
| 43 | Create specialization-specific benchmarks and individualized progress comparisons. |
| 44 | Build assessment evidence capture, validation, and reviewer workflows. |
| 45 | Generate performance reports and targeted improvement plans. |

## Phase 10 — Nutrition and Food Intelligence

| # | Prompt coverage |
|---|---|
| 46 | Build meal photography, manual food entry, and meal-history storage. |
| 47 | Integrate AI food recognition with ingredient and portion confirmation. |
| 48 | Create familiar-food preference learning, regional food support, and budget awareness. |
| 49 | Build specialization-aware meal guidance and nutrition education. |
| 50 | Implement nutrition safety restrictions, user corrections, and food-data privacy. |

## Phase 11 — Education and Learning

| # | Prompt coverage |
|---|---|
| 51 | Build lessons, modules, learning objectives, and curriculum sequencing. |
| 52 | Implement text, video, audio, illustrated lessons, and downloadable learning material. |
| 53 | Create quizzes, question banks, grading, explanations, and knowledge checkpoints. |
| 54 | Add spaced review, personalized lesson recommendations, and learning analytics. |
| 55 | Connect educational progress to specialization competencies and mastery requirements. |

## Phase 12 — Trainer Development

| # | Prompt coverage |
|---|---|
| 56 | Build optional trainer-development enrollment and learning pathway. |
| 57 | Teach exercise explanation, demonstration, coaching communication, and modifications. |
| 58 | Create practice-program design assignments and coaching case scenarios. |
| 59 | Build demonstration submissions, assessment rubrics, and trainer portfolios. |
| 60 | Implement trainer knowledge reviews and external certification-preparation resources. |

## Phase 13 — Documentation and Evidence

| # | Prompt coverage |
|---|---|
| 61 | Build workout journals, reflections, notes, and personal training history. |
| 62 | Create progress photo and exercise video recording/upload features. |
| 63 | Link evidence to exercises, competencies, assessments, and milestones. |
| 64 | Build chronological comparisons, progress timelines, and evidence summaries. |
| 65 | Implement secure media access, export, consent, retention, and deletion. |

## Phase 14 — AI Coaching

| # | Prompt coverage |
|---|---|
| 66 | Build the central AI orchestration service and structured response validation. |
| 67 | Connect AI coaching to user profiles, approved content, and training history. |
| 68 | Implement exercise explanations, personalized guidance, and knowledge questions. |
| 69 | Build AI progress interpretation and individualized next-step recommendations. |
| 70 | Add AI cost controls, caching, provider fallbacks, evaluation, and safety boundaries. |

## Phase 15 — Daily Command Center

| # | Prompt coverage |
|---|---|
| 71 | Build the Today dashboard with daily missions, training time, and readiness status. |
| 72 | Create competency maps, specialization progress, phase indicators, and milestones. |
| 73 | Build training calendars, scheduling, reminders, and recovery-day views. |
| 74 | Implement activity completion, adherence tracking, and accessible streaks. |
| 75 | Connect workout, nutrition, education, evidence, and assessment modules into one daily experience. |

## Phase 16 — Content Creation Studio

| # | Prompt coverage |
|---|---|
| 76 | Build administrator curriculum authoring and editing tools. |
| 77 | Implement AI-assisted lesson, quiz, exercise-script, and storyboard drafting. |
| 78 | Create content review queues, qualified approvals, and publication workflows. |
| 79 | Build content tagging, search, translations, accessibility, and version management. |
| 80 | Implement content-gap detection, user feedback analysis, and scheduled revisions. |

## Phase 17 — Analytics and Reports

| # | Prompt coverage |
|---|---|
| 81 | Build user fitness progress dashboards and performance charts. |
| 82 | Create competency achievement reports and learning analytics. |
| 83 | Implement specialization engagement, completion, and retention analytics. |
| 84 | Build content effectiveness, exercise feedback, and safety incident reporting. |
| 85 | Create administrative reporting and downloadable user portfolios. |

## Phase 18 — Payments and Platform Administration

| # | Prompt coverage |
|---|---|
| 86 | Build subscription plans, trials, and feature entitlements. |
| 87 | Integrate payment processing, billing status, and subscription management. |
| 88 | Create administrative roles, permissions, and staff access controls. |
| 89 | Build user support, issue reporting, moderation, and account administration. |
| 90 | Implement operational dashboards, system settings, and audit history. |

## Phase 19 — Testing and Hardening

| # | Prompt coverage |
|---|---|
| 91 | Write unit and integration tests for every core engine. |
| 92 | Test complete onboarding-to-Day-180 scenarios using simulated users. |
| 93 | Conduct security, privacy, authorization, and data-deletion testing. |
| 94 | Test accessibility, mobile responsiveness, offline operation, and performance. |
| 95 | Validate AI outputs, safety rules, exercise eligibility, and failure recovery. |

## Phase 20 — Deployment and Launch

| # | Prompt coverage |
|---|---|
| 96 | Configure production infrastructure, deployment environments, and backups. |
| 97 | Prepare mobile builds, app-store requirements, privacy disclosures, and release assets. |
| 98 | Run a controlled pilot with reviewed specialization content and monitored outcomes. |
| 99 | Fix pilot findings, finalize production readiness, and release the application. |
| 100 | Implement post-launch monitoring, content updates, incident response, and expansion to all 40 specializations. |

---

## Build overview

| | |
|---|---|
| DEVELOPMENT PROMPTS | 100 |
| IMPLEMENTATION PHASES | 20 |
| FITNESS SPECIALIZATIONS | 40 |
| MASTERY JOURNEY | 180 days |

**Recommended execution order:** Build the reusable platform first, then complete and validate one full specialization. Expand to all 40 through the same curriculum, exercise, content, and assessment systems.

## What 100 prompts will not automatically accomplish

The development prompts can build the software infrastructure, but they do not automatically produce a complete, trustworthy training academy.

A full launch also requires actual exercise demonstration footage, reviewed six-month curricula, appropriate performance benchmarks, nutrition content, qualified safety reviews, testing with real users, and ongoing content maintenance.

**Definition of fully built:** All 40 specializations have approved content, every core workflow functions end to end, mastery achievements have verifiable criteria, the AI operates within defined safeguards, and the production system is tested, monitored, and maintainable.

That — not simply completing Prompt 100 — should be the release standard.
