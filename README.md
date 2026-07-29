# Chimertech — AI-Powered Cattle Health Intelligence

A premium full-stack web application for AI-assisted cattle BCS scoring and disease detection.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Backend | Python FastAPI |
| Video Processing | OpenCV + ImageHash |
| AI Analysis | OpenAI GPT-4o Vision |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

---

## Project Structure

```
BCSOpnai/
├── frontend/         # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/   # Navbar, Footer
│   │   │   └── ui/       # All reusable UI components
│   │   ├── pages/        # Landing, BCS, Disease, History, Products, Profile, Auth
│   │   ├── hooks/        # useVideoAnalysis, useChat
│   │   ├── contexts/     # AuthContext
│   │   ├── lib/          # supabase.ts, api.ts
│   │   └── types/        # TypeScript types
│   └── .env.example
├── backend/          # FastAPI Python app
│   ├── main.py
│   ├── models/       # Pydantic schemas
│   ├── routers/      # upload, process, analyse, chat, products, results
│   ├── services/     # video_processor, openai_service, supabase_service
│   ├── data/         # products.json
│   └── .env.example
└── supabase/
    └── schema.sql    # Database schema + RLS policies
```

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Create a Storage bucket named **`frames`** (set to Public)
4. Copy your project URL, anon key, and service role key

### 2. Backend

```bash
cd backend

# Copy and fill in your credentials
cp .env.example .env
# Edit .env with your keys

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

> API docs available at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Copy and fill in your Supabase credentials
cp .env.example .env
# Edit .env — do NOT add OPENAI_API_KEY here

# Install dependencies
npm install

# Start dev server
npm run dev
```

> App available at: http://localhost:5173

---

## Environment Variables

### Backend `.env`

```env
OPENAI_API_KEY=sk-...          # OpenAI API key (BACKEND ONLY)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...  # Service role key (BACKEND ONLY)
SUPABASE_ANON_KEY=...
ALLOWED_ORIGINS=http://localhost:5173
MAX_VIDEO_SIZE_MB=50
MAX_VIDEO_DURATION_SECONDS=30
```

### Frontend `.env`

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...     # Anon key ONLY (never service role)
VITE_API_BASE_URL=http://localhost:8000
```

> ⚠️ **Never** put OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY in the frontend .env

---

## Features

- 🎬 **Video Processing** — Extract 1 frame/sec, remove blurry & duplicate frames, select top 10 by clarity
- 📊 **BCS Scoring** — AI-powered 1-5 body condition scoring with observations and feeding recommendations
- 🩺 **Disease Screening** — Visible sign detection with severity, urgency and next steps
- 💬 **AI Chatbot** — Context-aware cattle health assistant using stored analysis (no re-sending frames)
- 🛒 **Product Recommendations** — Rule-based & AI-assisted Chimertech product suggestions
- 🔒 **Row Level Security** — Users can only access their own data
- 📱 **Responsive** — Full mobile and desktop layout

---

## Safety & Disclaimers

- Results are AI-assisted screening only — not confirmed veterinary diagnoses
- Confidence scores are displayed clearly
- Veterinary consultation is always recommended for urgent cases
- No medication dosages are provided
