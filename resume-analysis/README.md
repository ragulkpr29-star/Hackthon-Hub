# Resume Analysis Service

A standalone Python microservice that extracts structured, normalized data
from PDF resumes using pretrained, open-source NLP models. It is designed
to be called from another application (e.g. a Next.js + Supabase app) over
a simple HTTP API — it contains **no frontend code**.

- **PDF parsing:** [PyMuPDF](https://pymupdf.readthedocs.io/)
- **Entity extraction:** [GLiNER](https://github.com/urchade/GLiNER) (`urchade/gliner_medium-v2.1`) — zero-shot NER, no training
- **Skill normalization:** [Sentence-Transformers](https://www.sbert.net/) (`all-MiniLM-L6-v2`) + scikit-learn cosine similarity — inference only, no training
- **API:** FastAPI + Uvicorn

Every model used is **pretrained and open-source**. Nothing is trained,
fine-tuned, or fitted in this repository — the "AI" steps are entirely
inference calls against existing models.

---

## Project structure

```
resume-analysis/
├── app/
│   ├── main.py            # FastAPI app, startup model loading, endpoints, error handling
│   ├── parser.py           # PyMuPDF-based PDF text extraction
│   ├── cleaner.py          # Text normalization/cleaning
│   ├── extractor.py        # GLiNER zero-shot entity extraction
│   ├── matcher.py           # Sentence-BERT + scikit-learn skill normalization
│   ├── service.py           # Orchestrates parser -> cleaner -> extractor -> matcher
│   ├── schemas.py           # Pydantic request/response models
│   ├── config.py             # Centralized settings (env-overridable)
│   ├── exceptions.py        # Typed domain exceptions
│   ├── dependencies.py       # FastAPI dependency-injection providers
│   └── utils.py              # Logging + small helpers
├── models/                  # (empty) optional local cache dir for model weights
├── data/
│   └── skills.json          # Canonical skills taxonomy used for normalization
├── tests/                    # Unit + API tests (see "Testing" below)
│   └── fixtures/sample_resume.pdf
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 1. Create a virtual environment

```bash
python3 -m venv venv
```

Activate it:

```bash
# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

This installs FastAPI, PyMuPDF, spaCy, sentence-transformers, GLiNER,
scikit-learn, etc. **It does not download any model weights yet** — those
download automatically the first time the server starts (see below).

> **Note:** `sentence-transformers`, `gliner`, and `torch` are large
> packages. Installation can take several minutes depending on your
> connection.

## 3. Run the server

```bash
uvicorn app.main:app --reload
```

On first startup, the service automatically downloads:

- `all-MiniLM-L6-v2` (~90 MB) from Hugging Face
- `urchade/gliner_medium-v2.1` (~500 MB) from Hugging Face

This requires internet access and can take a few minutes the very first
time. Downloaded weights are cached locally (in the standard Hugging Face
cache directory) so subsequent restarts are fast. Models are loaded
**exactly once** at startup and reused for every request — they are never
reloaded per-request.

The API is now available at `http://127.0.0.1:8000`. Interactive docs:
`http://127.0.0.1:8000/docs`.

## 4. Test the endpoint

Using the bundled sample resume:

```bash
curl -X POST http://127.0.0.1:8000/analyze-resume \
  -F "resume=@tests/fixtures/sample_resume.pdf"
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

---

## API reference

### `POST /analyze-resume`

**Request:** `multipart/form-data` with a single field `resume` containing a PDF file.

**Success response (`200`):**

```json
{
  "success": true,
  "raw_text": "...",
  "analysis": {
    "programming_languages": ["Python", "JavaScript"],
    "frameworks": ["FastAPI", "React"],
    "libraries": [],
    "databases": ["PostgreSQL"],
    "cloud": ["Amazon Web Services"],
    "devops": ["Docker", "Kubernetes"],
    "ai_ml": [],
    "tools": ["Git"],
    "soft_skills": [],
    "education": ["Stanford University"],
    "certifications": ["AWS Certified Solutions Architect - Associate"],
    "projects": [],
    "experience": [{ "job_title": "Senior Software Engineer", "company": "Acme Corp" }],
    "companies": ["Acme Corp"],
    "job_titles": ["Senior Software Engineer"]
  }
}
```

**Scanned / image-based PDF (`200`, no OCR is performed):**

```json
{ "success": false, "message": "Scanned or image-based PDF detected. OCR required." }
```

**Other handled errors:**

| Condition                  | HTTP status | 
|-----------------------------|:-----------:|
| Missing / non-PDF file       | `415`       |
| Empty file                   | `400`       |
| Encrypted / corrupted PDF    | `400`       |
| File exceeds size limit (default 10 MB) | `413` |
| Model failed to load          | `503`      |

All error responses share the shape `{"success": false, "message": "..."}`.

### `GET /health`

Returns `{"status": "ok", "models_loaded": true}` once both ML models
have finished loading.

---

## Testing

```bash
pytest -v
```

The test suite (25 tests) is **fully offline** and runs in a couple of
seconds — it never downloads or loads the real GLiNER / Sentence-BERT
model weights:

- `test_parser.py`, `test_cleaner.py` — real PyMuPDF/regex logic, no ML.
- `test_extractor.py` — the sentence-aware chunking helper (pure spaCy
  rule-based sentencizer, no model download).
- `test_matcher.py` — exact-alias skill normalization against
  `data/skills.json` (validates the spec's own examples: `Node → Node.js`,
  `JS → JavaScript`, `Py → Python`, `ReactJS → React`, `Spring → Spring Boot`).
- `test_service.py` — the job-title/company pairing heuristic.
- `test_api.py` — full HTTP request/response cycle, with `EntityExtractor`
  and `SkillMatcher` swapped for lightweight fakes injected via
  `app.state` (this is what the dependency-injection design in
  `dependencies.py` is for).

This works because `extractor.py` and `matcher.py` import `gliner` and
`sentence-transformers` **lazily**, inside their `load()` methods, rather
than at module scope — so the modules (and everything that depends on
them, including the FastAPI app itself) stay importable and testable
even before those heavy libraries are exercised.

---

## Configuration

All settings are defined in `app/config.py` and overridable via
environment variables prefixed with `RESUME_ANALYSIS_`, e.g.:

```bash
export RESUME_ANALYSIS_MAX_FILE_SIZE_MB=20
export RESUME_ANALYSIS_LOG_LEVEL=DEBUG
export RESUME_ANALYSIS_GLINER_SCORE_THRESHOLD=0.35
```

Key settings: `max_file_size_mb`, `gliner_score_threshold`,
`semantic_similarity_threshold`, `sentence_transformer_model`,
`gliner_model`.

---

## Extending the skills taxonomy

`data/skills.json` maps canonical skill names to their known aliases, per
category (`programming_languages`, `frameworks`, `libraries`, `databases`,
`cloud`, `devops`, `ai_ml`, `tools`). To teach the service a new
normalization (e.g. an internal tool name), just add an entry:

```json
"frameworks": {
  "My Custom Framework": ["mycustomfw", "mcf"]
}
```

Terms found in resumes that don't exactly match an alias still get a
second chance via Sentence-BERT cosine similarity against the canonical
names in the same category (threshold configurable via
`semantic_similarity_threshold`); if that also misses, the original term
is kept as-is rather than dropped, so nothing is silently lost.

---

## Docker

```bash
docker build -t resume-analysis .
docker run -p 8000:8000 resume-analysis
```

Model weights download on first container startup (same as running
locally). To bake them into the image at build time instead (useful for
air-gapped deployments), uncomment the two `RUN python -c "..."` lines
near the bottom of the `Dockerfile`.

---

## Design notes & known limitations

- **No OCR.** Scanned/image-based PDFs are detected and rejected with a
  clear message, per spec — OCR is intentionally out of scope.
- **`experience` pairing is a heuristic.** GLiNER extracts job titles and
  companies as independent entity types with no inherent relationship
  between them. `service.py` reconstructs likely `(title, company)` pairs
  by proximity of their first mention in the text. This works well for
  typical reverse-chronological resumes but is not a guarantee of
  correctness for unusual layouts (e.g. multi-column resumes, or a title
  listed far from its company).
- **Zero-shot NER accuracy.** GLiNER is prompted with label names rather
  than fine-tuned on resumes specifically; extraction quality depends on
  document formatting and is not perfect, same as any zero-shot model.
- **Fail-fast startup.** If either model fails to load (e.g. no internet
  access on first run), the application intentionally refuses to start
  rather than serving degraded responses.
