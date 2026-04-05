# 📈 JobPulse

> **The Stock Market, but for Skills.** Trade professional skills like stocks, watch prices move with real-world job demand, and rise to the top of the leaderboard.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite)

---

## 🧠 What is JobPulse?

JobPulse is a **virtual trading platform that gamifies the job market**. Instead of stocks, you trade shares in professional skills — think `"AI/ML Engineer"`, `"React Developer"`, or `"DevOps"`.

Prices fluctuate dynamically based on **real-world job posting data** fetched from the JSearch API every 12 hours. Your goal? Build the most valuable skill portfolio and dominate the leaderboard.

All trades use **JobCoins (JC)** — a virtual currency — so there's no real money involved. Just strategy, timing, and market intuition.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Real-Time Trading** | Buy and sell skill shares with atomic Supabase RPCs ensuring data integrity |
| 🔄 **Dynamic Pricing Engine** | Prices shift up to ±5% every 12 hours based on live job market demand |
| ⚡ **Live Market Updates** | Portfolio and prices refresh in real-time via Supabase WebSockets |
| 💼 **Portfolio Dashboard** | Track cash balance, total portfolio value, and full transaction history |
| 🏆 **Global Leaderboard** | Compete by total wealth and most profitable trades |
| 🎁 **Referral Program** | Invite friends with unique codes — both earn bonus JobCoins on first trade |

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 18** (TypeScript) + **Vite**
- 🎨 **Tailwind CSS**
- 🔄 **TanStack React Query** — data fetching & caching
- 📈 **Recharts** — interactive price history graphs
- 🧭 **React Router DOM**

### Backend
- 🟢 **Node.js** + **Express**
- ✅ **Zod** — strict request payload validation
- ⏰ **node-cron** — scheduled market demand scraping

### Database & Auth
- 🗄️ **Supabase** (PostgreSQL)
- 🔐 Supabase Auth with Row Level Security (RLS)
- ⚙️ Database Triggers & PostgreSQL RPCs for atomic trade execution

### External APIs
- 🔍 **JSearch via RapidAPI** — real-world job demand data

---

## 🚀 Getting Started

### Prerequisites

- Node.js **v18+**
- A [Supabase](https://supabase.com/) account and project
- A [RapidAPI](https://rapidapi.com/) account with JSearch access

---

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/JobPulse.git
cd JobPulse
```

---

### 2. Database Setup (Supabase)

1. Open the **SQL Editor** in your Supabase dashboard.
2. Run the migration scripts in order from `supabase/migrations/`:

```
20260404063457_create_skillmarket_schema.sql
20260404063517_seed_initial_skills.sql
```

3. Enable **Email/Password Authentication** in your Supabase project settings.

---

### 3. Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RAPIDAPI_KEY=your_jsearch_rapidapi_key
```

Start the backend:

```bash
npm run dev
# Server + cron jobs run on http://localhost:5000
```

---

### 4. Client Setup

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

---

## 📂 Project Structure

```
JobPulse/
├── client/                   # ⚛️ React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI (Auth, Navbar, Cards…)
│   │   ├── contexts/         # AuthContext
│   │   ├── lib/              # Supabase client init
│   │   ├── pages/            # Dashboard, Wallet, Landing, Leaderboard…
│   │   └── App.tsx           # App routing entry point
│   └── tailwind.config.js
│
├── server/                   # 🟢 Node.js Backend
│   ├── routes/               # Express routes (trade, skills, leaderboard)
│   ├── workers/              # Background jobs (demandScraper.js)
│   ├── middleware/           # Auth verification
│   └── server.js             # Entry point
│
└── supabase/
    └── migrations/           # 🗄️ Schema & seed SQL scripts
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <sub>Built with ☕, TypeScript, and a belief that skills are the new assets.</sub>
</div>