# Fit Life Bro — AI Health & Fitness Planner

> A full-stack health companion that plans your meals and workouts, tracks your water and weight, and reminds you at the right moment — built and shipped live by **Hamid Ansari** ([@itshamiz01](https://github.com/itshamiz01)).

**🔗 Live app: [fitlife-ai-health-tracker.vercel.app](https://fitlife-ai-health-tracker.vercel.app)**

---

## About this project

Fit Life Bro is a complete, production health-tracking product — not a demo. Users sign up, get personalised meal and activity plans, log water intake and weight, check off completed meals and workouts, and receive real push notifications on their phone when it's time to eat, train or hydrate.

This repository contains two generations of the product:

| Part | What it is | Stack |
|---|---|---|
| `full-stack-health-tracker/` | **Fit Life Bro (the live product)** — full-stack app with accounts, database and push notifications | Next.js · TypeScript · PostgreSQL · Drizzle ORM · Web Push (VAPID) · Vercel |
| Repository root | FitLife AI Planner — the original planner UI | React · Vite · Tailwind CSS |

## What it does

- ✅ User accounts with secure sign-in
- ✅ Personalised meal plans and activity/workout plans
- ✅ Water-intake tracking with scheduled push reminders
- ✅ Meal & workout push notifications — fired at each planned time, in the device's own timezone, skipped automatically when you've already checked the item off
- ✅ Weight logging and progress tracking
- ✅ Works as an installable mobile web app (Android-first)

## How the reminders work

A scheduler checks every 10 minutes and calls the app's reminder endpoints. Notifications are kind-aware — a meal reminder opens the Meals view, a workout reminder opens the Workouts view — with a per-user ledger so nobody ever gets the same reminder twice, and a 20-minute grace window so a reminder is never sent stale.

## Run it locally

**Fit Life Bro (full-stack):**

```bash
cd full-stack-health-tracker
npm install
npm run dev
```

Requires a PostgreSQL database (`DATABASE_URL`) — see the app's own configuration for details.

**Planner UI (root):**

```bash
npm install
npm run dev
```

## Tech highlights

Full-stack TypeScript · Next.js App Router · PostgreSQL + Drizzle ORM · Service-worker Web Push with VAPID keys · Cron-driven scheduling · Deployed and verified live on Vercel

---

*Part of Hamid Ansari's portfolio — see the [profile](https://github.com/itshamiz01) for autonomous AI systems, a Forex trading engine and more.*
