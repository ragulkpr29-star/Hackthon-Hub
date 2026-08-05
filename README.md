# Hackathon Hub

AI-powered collaboration platform for KEC students to discover teammates, verify technical skills, and build winning hackathon projects together.

Built with **Next.js 16** (App Router), **Supabase**, **Tailwind CSS**, **shadcn/ui**, and **Framer Motion**.

---

## Prerequisites

| Tool       | Version  | Notes                                        |
| ---------- | -------- | -------------------------------------------- |
| Node.js    | ≥ 18     | Required for Next.js                         |
| Python     | ≥ 3.10   | Required for the resume-analysis ML service  |
| npm        | ≥ 9      | Comes with Node.js                           |

## Getting Started

### 1. Clone & install

```bash
cd hackathon-hub
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase, Gemini, and GitHub credentials. See [.env.example](.env.example) for documentation on each variable.

### 3. Run the development server

```bash
# Next.js only (resume analysis will be unavailable):
npm run dev

# Next.js + Resume Analysis ML service (recommended):
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Resume Analysis ML Service

The project includes a standalone **FastAPI** microservice at `/resume-analysis` that extracts structured skill data from PDF resumes using **GLiNER** (NER) and **Sentence-Transformers** (semantic matching).

### First-time setup

```bash
cd resume-analysis
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

> [!IMPORTANT]
> The first run downloads **~600 MB** of Hugging Face models (`urchade/gliner_base` and `all-MiniLM-L6-v2`). Make sure you have a stable internet connection. Subsequent starts load from the local cache.

### Running the service

```bash
# From the repo root:
npm run dev:ml

# Or manually:
cd resume-analysis
uvicorn app.main:app --reload --port 8000
```

The service runs at `http://localhost:8000`. The Next.js proxy route at `/api/v1/analyze-resume` forwards requests to it (configured via `RESUME_ANALYSIS_URL` in `.env.local`).

### Health check

```
GET http://localhost:8000/health
```

Returns `{ "status": "ok", "models_loaded": true }` when ready.

---

## Project Structure

```
hackathon-hub/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Login, register, forgot-password
│   ├── (main)/             # Authenticated pages (home, profile, etc.)
│   ├── api/                # Server-side API routes
│   └── onboarding/         # Profile completion flow
├── components/             # React components (UI + shared)
├── hooks/                  # Custom React hooks
├── lib/                    # Core logic, services, repositories, types
├── resume-analysis/        # FastAPI ML microservice (Python)
│   ├── app/                # FastAPI app, models, extractors
│   ├── data/               # Skill taxonomy data
│   └── tests/              # Python tests
└── supabase/               # Supabase migrations & config
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Supabase (Postgres + Auth + Storage)
- **AI/ML**: Google Gemini (GitHub analysis), GLiNER + Sentence-Transformers (resume analysis)
- **Resume Service**: Python FastAPI, PyMuPDF, GLiNER, sentence-transformers
