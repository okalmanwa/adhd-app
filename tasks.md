# 🛠️ MVP Build Plan: ADHD Gamified Study App

## 🧱 Phase 1: Project Setup

### 1. Initialize Next.js Project

**Start:** Run `npx create-next-app`
**End:** Local dev server is running, project is scaffolded

### 2. Set Up Tailwind CSS

**Start:** Install Tailwind via PostCSS
**End:** Tailwind classes work in `index.tsx`

### 3. Set Up Supabase Project

**Start:** Create project on [supabase.io](https://supabase.io)
**End:** You have URL + anon key, Supabase dashboard open

### 4. Connect Supabase to App

**Start:** Add `.env.local` with keys
**End:** A test call (e.g. fetch session) works from frontend

---

## 👥 Phase 2: Auth & User Flow

### 5. Implement Sign Up Page

**Start:** Create `pages/register.tsx`
**End:** User can sign up, Supabase shows new user

### 6. Implement Login Page

**Start:** Create `pages/login.tsx`
**End:** User can log in and is redirected to dashboard

### 7. Set Up Auth State Hook

**Start:** Create `useUser.ts`
**End:** App detects logged-in user and persists session

### 8. Create Protected Route Wrapper

**Start:** Build `withAuth` HOC
**End:** Dashboard redirects unauthenticated users

---

## 🧩 Phase 3: Task Management

### 9. Create Task Table in Supabase

**Start:** Add schema for `tasks` table
**End:** You can insert a row via Supabase table editor

### 10. Build Add Task Form

**Start:** Create input fields + urgency dropdown
**End:** Form calls `supabase.from("tasks").insert(...)`

### 11. List User’s Tasks

**Start:** Query tasks for logged-in user
**End:** Task cards render with title and urgency badge

### 12. Mark Task as Complete

**Start:** Add checkbox or "Complete" button
**End:** `completed` field in DB updates to `true`

---

## 🎮 Phase 4: Gamified Rewards

### 13. Create Rewards Table in Supabase

**Start:** Add `rewards` table schema
**End:** Table accepts user\_id, xp\_points, level

### 14. Grant XP on Task Completion

**Start:** Hook into "complete task" logic
**End:** Rewards table increments XP based on urgency

### 15. Calculate Level From XP

**Start:** Add helper: `level = floor(xp / 50)`
**End:** Display level on dashboard

### 16. Show Reward Modal

**Start:** Build modal with animation/sound
**End:** Completing task triggers modal

---

## 🎛️ Phase 5: State + UX Polish

### 17. Create Zustand Task Store

**Start:** Define state in `/state/useTaskStore.ts`
**End:** Task list is managed via Zustand

### 18. Create Zustand Reward Store

**Start:** Add store for XP, level, modal state
**End:** Rewards handled outside components

### 19. Add Loading & Error States

**Start:** Add spinner and error message logic
**End:** Feedback shown for all async actions

### 20. Build Timer for "Zoning Mode"

**Start:** Use `setInterval` to build 25/5 Pomodoro
**End:** User can toggle a timer per task

---

## 🧪 Phase 6: Testing

### 21. Write Unit Test for Task Creation

**Start:** Create test with mock Supabase
**End:** Form inputs trigger correct DB insert

### 22. Test Auth Flow

**Start:** Use Cypress or Jest to mock sign in
**End:** All redirects + session logic verified

### 23. Test XP Calculation

**Start:** Manually set XP and test level logic
**End:** Output matches expected level

---

## 🚀 Phase 7: Launch Readiness

### 24. Deploy to Vercel

**Start:** Connect GitHub repo to Vercel
**End:** App is deployed and public

### 25. Add SEO Meta + App Title

**Start:** Update `_document.tsx` + `<Head>`
**End:** Title shows in browser + search previews

### 26. Write README + Usage Instructions

**Start:** Outline install/run/flow
**End:** Clean `README.md` for contributors

