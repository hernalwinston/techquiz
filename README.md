# QuizBattle - Real-Time Quiz Game System

A complete quiz game system with admin dashboard, student registration, live games with real-time scoring, leaderboards, and reports. Powered by **Supabase**.

---

## Design

**White + Night Mode** — Clean, modern interface with light and dark themes. Toggle between them with the switch in the navbar. The system automatically detects your OS preference on first visit and remembers your choice.

- **Light Mode:** Pure white background, glassmorphism cards, soft shadows
- **Dark Mode:** Deep black background, subtle purple glow on hover, dark glass cards
- **Accent:** Indigo (#6366F1) for all buttons, links, and highlights

---

## Features

- **Admin Panel** — Create quizzes (MCQ, True/False, Identification), manage users, host live games
- **Student Dashboard** — Register, join games with PIN codes, view past results
- **Live Games** — Real-time quiz competition with timer, speed scoring, and leaderboard
- **Reports** — Export CSV reports of game results
- **Light/Dark Mode** — Persistent theme toggle with OS preference detection

---

## Setup (2 Steps)

### Step 1: Run the SQL
1. Go to your Supabase Dashboard
2. Click **SQL Editor**
3. Paste the entire contents of `schema.sql`
4. Click **Run**

### Step 2: Turn Off Email Confirmation
1. Go to **Authentication > Providers > Email**
2. Turn **OFF** "Confirm email"
3. Click Save

---

## How to Use

1. Open `index.html` in your browser
2. Click **Get Started** to register as a student
3. For admin: go to `pages/setup-admin.html` to create an admin account
4. Admin creates quizzes in the Quiz Manager tab
5. Admin starts a Live Game and shares the 6-digit PIN
6. Students join from their dashboard using the PIN
7. Questions are served in real-time with countdown timers
8. Scores are calculated based on correctness + speed
9. Leaderboards and reports are available after the game

---

## Files

```
quiz-system/
├── index.html              # Landing page (hero + features + footer)
├── schema.sql              # Database setup (run in Supabase)
├── css/
│   └── main.css            # Complete design system (light/dark themes)
├── js/
│   ├── supabase-config.js  # Supabase config (URL + Key)
│   ├── theme.js            # Light/Dark mode toggle logic
│   ├── auth.js             # Authentication module
│   └── utils.js            # Utility functions
├── pages/
│   ├── login.html          # Student/Admin login (tabbed)
│   ├── register.html       # Student registration (2-step)
│   ├── dashboard.html      # Student dashboard
│   ├── game.html           # Live game player view
│   ├── admin.html          # Admin panel (quiz builder, game control, reports)
│   └── setup-admin.html    # First-time admin setup
└── assets/                 # Profile images folder
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | Student profiles (name, points) |
| `admins` | Admin accounts |
| `quizzes` | Quizzes with questions (JSONB) |
| `games` | Game sessions with PIN codes |
| `game_players` | Players joined to a game |
| `game_answers` | Individual answers per question |
| `leaderboards` | Historical game results |
| `banned` | Banned users |

---

## Supabase Connection

All files use this config from `js/supabase-config.js`:
```
URL:  https://rknsbfykyulrejnbwjuf.supabase.co
Key:  sb_publishable_1eOKsHa61pzfly5n4DMutg_hOpDQLMe
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database error saving new user" | Drop all triggers in SQL Editor, re-run schema.sql |
| "Email not confirmed" | Turn off email confirmation in Authentication > Providers > Email |
| No quizzes showing | Run schema.sql first, then create quizzes in admin panel |
| Live game not updating | App uses polling (2s interval) - this is normal |
| Can't login as admin | Make sure you registered through setup-admin.html first |
