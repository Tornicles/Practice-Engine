# Forge — AI Personal Trainer (web)

Static web build of the Forge AI personal-trainer app. No framework, no build
step — deploy the folder as a static site.

## Deploy (Vercel)

- Import this repo in Vercel
- **Framework Preset:** Other
- **Root Directory:** `forge-web`
- Build Command: (empty) · Output Directory: (empty)

`forge-web/index.html` is the standalone single-file build: all 122 coach demo
videos, program covers and coach images are inlined as data URIs, so the whole
app is one file.

## Develop

`forge-web/src/` holds the development version: `index.html` plus `assets/`
(exercise videos in `assets/vid-small/`, program covers in `assets/img/`).
Open `src/index.html` in a browser to run it locally.

## Features

61 exercises × 3 levels (beginner / intermediate / hard) with real Marcus & Maya
coach demo videos · 15 programs across strength, yoga, mobility, HIIT, pilates
and low-impact · talking AI coach (unhinged by default) with voice guidance ·
motivation engine (affirmations, war cries, playlists) · Strava-like GPS run
tracking with calories, PRs and repeatable routes · grocery-to-meals planner
(40 recipes from what's on hand) · location-aware food guidance (8 regions) ·
AI body check → personalized plan · job-aware programming · exercise-to-snooze
alarm · Breathe & Release sessions · social, wearables, GLP-1 and longevity
tracks.
