<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=JobPulse&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Institutional%20Placement%20Support%20System&descAlignY=58&descSize=20&descColor=a78bfa&animation=fadeIn" width="100%"/>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge&logo=statuspage&logoColor=white" />
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge" />
</p>

<br/>

> **JobPulse** is a real-time market demand radar and predictive skill-tracking platform designed for CS & IT departments — bridging the gap between academic curriculum and active industry requirements.

<br/>

</div>

---

## 🎯 Primary Objectives

| 👤 For Students | 🏛️ For HODs & Faculty |
|---|---|
| A data-driven compass for learning — *"What should I learn next to maximize placement chances?"* | An admin dashboard showing cohort-wide learning trends vs. live market demand to optimize training programs. |

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 📊 Live Market Radar
Tracks **40+ specialized CS/IT roles** (MERN, AWS, Cybersecurity, etc.) and assigns a dynamic **Demand Score** based on daily job postings.

</td>
<td width="50%">

### 📈 Trend Indicators
Uses historical data to classify technologies as **Surging 🔥**, **Stable ✅**, or **Declining 📉** — helping students avoid outdated tech.

</td>
</tr>
<tr>
<td width="50%">

### 🧑‍🎓 Personalized Skill Tracking
Students build portfolios by tracking skills across three stages:
`Interested` → `Learning` → `Mastered`

</td>
<td width="50%">

### 🤖 Automated Intelligence
A decoupled Node.js background worker fetches live job market data **daily** via the JSearch API to keep the radar always accurate.

</td>
</tr>
</table>

---

## 🛠️ Technology Stack

<div align="center">

| Layer | Technology | Hosting |
|:---:|:---:|:---:|
| **Frontend** | React.js (Vite) · TypeScript · Tailwind CSS | ![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel) |
| **Backend** | Node.js · Express.js · node-cache · express-rate-limit | ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black) |
| **Database** | Supabase (PostgreSQL) · Supabase Auth · SQL Triggers | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=black) |

</div>

---

## 🏗️ Architecture & Scalability

> Engineered to handle **thousands of concurrent students**, optimized for high-traffic department launches.

```
┌─────────────────────────────────────────────────────┐
│                   JobPulse System                   │
│                                                     │
│   ┌──────────┐     ┌──────────┐     ┌───────────┐  │
│   │  React   │────▶│ Express  │────▶│ Supabase  │  │
│   │ Frontend │     │   API    │     │    DB     │  │
│   └──────────┘     └──────────┘     └───────────┘  │
│                         │                           │
│                    ┌────┴─────┐                     │
│                    │ JSearch  │  ← Background Worker │
│                    │ Scraper  │    (runs daily)      │
│                    └──────────┘                     │
└─────────────────────────────────────────────────────┘
```

- ⚡ **Decoupled Workers** — JSearch scraper runs on a separate process (`concurrently`) to prevent blocking the main API
- 🧠 **Aggressive Caching** — Heavy DB queries cached in-memory with 15–30s TTL, reducing database load by **99%** during spikes
- 🔒 **Campus-Ready Rate Limiting** — Handles hundreds of students on the same university IP while blocking malicious bots

---

## 🚀 Local Development Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/jobpulse.git
cd jobpulse
```

### 2️⃣ Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RAPIDAPI_KEY=your_jsearch_rapidapi_key
NODE_ENV=development
```

Start the backend (API + Scraper run simultaneously):

```bash
npm start
```

### 3️⃣ Setup the Frontend

Open a **new terminal**:

```bash
cd client
npm install
```

Create a `.env` file inside `client/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
```

> 🟢 Frontend runs at `http://localhost:5173` · Backend runs at `http://localhost:3000`

---

## 🗄️ Database Schema Overview

```
profiles          → Student data, department, graduation year
skills            → Master list of CS/IT tech + Demand Scores
tracked_skills    → Student ↔ Skill mapping (Interested/Learning/Mastered)
demand_history    → Daily demand score logs powering UI trend charts
```

---

## 🤝 Contributing

This project was built for the CS/IT department. Students are welcome to contribute!

1. 🍴 Fork the repository
2. 🌿 Create your feature branch: `git checkout -b feature/amazing-feature`
3. 💾 Commit your changes: `git commit -m 'Add amazing feature'`
4. 📤 Push to the branch: `git push origin feature/amazing-feature`
5. 🔁 Open a Pull Request with a detailed description

---

<div align="center">

## 📄 License

This project is licensed under the **MIT License** — feel free to use and build on it.

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=100&section=footer" width="100%"/>

*Built with 💜 for smarter placements*

</div>