# Math Rapid Fire Pro

An AI-powered counselling assessment SaaS for live rapid-fire math sessions (UKG–Grade 7), designed to help counsellors demonstrate learning gaps and strengths in real time.

## 1) Product Scope

### Primary goals
- Run live assessment sessions during counselling calls.
- Adapt question difficulty based on speed + accuracy.
- Score performance with explainable metrics.
- Generate visual reports and PDF summaries.
- Support multi-tenant SaaS operations for organizations.

### Roles
- **Counsellor**: Creates/runs sessions, views reports, downloads PDFs.
- **Admin**: Views org-wide analytics, counsellor performance, trends.
- **Student**: Participates in guided quiz flow.

---

## 2) Recommended Monorepo Architecture

```txt
math-rapid-fire-pro/
├─ apps/
│  ├─ web/                              # Next.js frontend
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (auth)/
│  │  │  │  │  ├─ login/page.tsx
│  │  │  │  ├─ counsellor/
│  │  │  │  │  ├─ dashboard/page.tsx
│  │  │  │  │  ├─ sessions/new/page.tsx
│  │  │  │  │  ├─ sessions/[id]/live/page.tsx
│  │  │  │  │  ├─ reports/[id]/page.tsx
│  │  │  │  ├─ admin/
│  │  │  │  │  ├─ dashboard/page.tsx
│  │  │  │  ├─ api/health/route.ts
│  │  │  ├─ components/
│  │  │  │  ├─ game/TimerCircle.tsx
│  │  │  │  ├─ game/ScoreBoard.tsx
│  │  │  │  ├─ game/QuestionCard.tsx
│  │  │  │  ├─ charts/RadarPerformance.tsx
│  │  │  │  ├─ charts/DifficultyLine.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useSocketSession.ts
│  │  │  │  ├─ useSessionTimer.ts
│  │  │  ├─ lib/
│  │  │  │  ├─ apiClient.ts
│  │  │  │  ├─ auth.ts
│  │  │  ├─ types/
│  │  │  │  ├─ session.ts
│  │  │  │  ├─ report.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ next.config.js
│  │  └─ Dockerfile
│  │
│  └─ api/                              # Node.js + Express backend
│     ├─ src/
│     │  ├─ app.ts
│     │  ├─ server.ts
│     │  ├─ config/
│     │  │  ├─ env.ts
│     │  │  ├─ db.ts
│     │  ├─ modules/
│     │  │  ├─ auth/
│     │  │  │  ├─ auth.controller.ts
│     │  │  │  ├─ auth.service.ts
│     │  │  │  ├─ auth.routes.ts
│     │  │  ├─ sessions/
│     │  │  │  ├─ sessions.controller.ts
│     │  │  │  ├─ sessions.service.ts
│     │  │  │  ├─ sessions.routes.ts
│     │  │  ├─ analytics/
│     │  │  │  ├─ analytics.controller.ts
│     │  │  │  ├─ analytics.service.ts
│     │  │  │  ├─ scoring.engine.ts
│     │  │  ├─ adaptive/
│     │  │  │  ├─ adaptive.engine.ts
│     │  │  ├─ explanations/
│     │  │  │  ├─ nlp.scorer.ts
│     │  │  ├─ recommendations/
│     │  │  │  ├─ recommendation.engine.ts
│     │  │  ├─ reports/
│     │  │  │  ├─ pdf.service.ts
│     │  │  ├─ admin/
│     │  │  │  ├─ admin.controller.ts
│     │  │  │  ├─ admin.service.ts
│     │  ├─ middleware/
│     │  │  ├─ auth.middleware.ts
│     │  │  ├─ role.middleware.ts
│     │  ├─ models/
│     │  │  ├─ User.ts
│     │  │  ├─ QuizSession.ts
│     │  ├─ sockets/
│     │  │  ├─ session.socket.ts
│     │  ├─ shared/
│     │  │  ├─ errors/
│     │  │  ├─ logger/
│     │  │  ├─ types/
│     ├─ Dockerfile
│     └─ tsconfig.json
│
├─ packages/
│  ├─ ui/                               # shared UI components
│  ├─ config/                           # shared eslint/tsconfig
│  ├─ question-bank/                    # curriculum + difficulty-tagged questions
│
├─ infra/
│  ├─ docker-compose.yml
│  ├─ nginx.conf
│  └─ deployment.md
│
├─ .env.example
├─ package.json
└─ README.md
```

---

## 3) Core Domain Model

### `User`
- `role`: `COUNSELLOR | ADMIN`
- `name`, `email`, `passwordHash`
- `organizationId`
- timestamps

### `QuizSession`
- `organizationId`, `createdBy`
- `studentName`, `grade`
- `status`: `CREATED | LIVE | COMPLETED`
- `rounds[]` with questions + answers + timing
- `difficultyProgression[]`
- `scores`:
  - `numberSense`
  - `speed`
  - `concept`
  - `application`
  - `confidenceIndex`
- `generatedReport`, `recommendation`

### Optional supporting collections
- `Organization`
- `Question`
- `SessionEvent` (for audit/live replay)

---

## 4) Game Engine Flow

### Round design
1. **Warm Up**: 3 easy questions, short timer.
2. **Concept Probe**: 3 moderate questions, explanation required.
3. **Application**: 2 word problems.
4. **Vedic Speed Round**: 2 advanced questions + animation.

### Per-question lifecycle
1. `question:serve` via API/socket.
2. Timer starts (server-authoritative timestamp).
3. Student answer submitted.
4. Server validates correctness + response time.
5. If explanation question: NLP scorer computes clarity.
6. Adaptive engine updates difficulty index.
7. Scoreboard updates in real time.

---

## 5) Adaptive Difficulty (Rule Engine)

```ts
// apps/api/src/modules/adaptive/adaptive.engine.ts
export function getNextDifficulty(current: number, events: Array<{correct: boolean; timeMs: number}>) {
  const recent3 = events.slice(-3);
  const allFastAndCorrect = recent3.length === 3 && recent3.every(e => e.correct && e.timeMs <= 7000);

  const recentAccuracy = events.slice(-6);
  const accuracy = recentAccuracy.filter(e => e.correct).length / Math.max(recentAccuracy.length, 1);

  if (allFastAndCorrect) return Math.min(current + 1, 10);
  if (accuracy < 0.5) return Math.max(current - 1, 1);
  return current;
}
```

Difficulty index is persisted after each question for graphing and auditability.

---

## 6) AI-Based Explanation Evaluation (Lightweight NLP)

```ts
// apps/api/src/modules/explanations/nlp.scorer.ts
const LOGIC_KEYWORDS = ["because", "therefore", "first", "then", "so"];
const MATH_VOCAB = ["sum", "difference", "carry", "borrow", "multiple", "factor", "quotient"];

export function scoreExplanation(text: string): number {
  const t = text.toLowerCase();
  const logicHits = LOGIC_KEYWORDS.filter(k => t.includes(k)).length;
  const vocabHits = MATH_VOCAB.filter(k => t.includes(k)).length;
  const lengthScore = Math.min(text.trim().split(/\s+/).length / 20, 1);

  const raw = logicHits * 0.4 + vocabHits * 0.4 + lengthScore * 0.2;
  return Math.round(Math.min(raw / 3, 1) * 10); // 0..10
}
```

This provides deterministic scoring that is explainable, fast, and cost-efficient for production MVP.

---

## 7) Analytics Engine

### Signals captured
- Response time per question
- Accuracy by round/type
- Explanation clarity
- Streak/consistency
- Difficulty trend

### Derived metrics
- **Number Sense Score**
- **Speed Score**
- **Concept Score**
- **Application Score**
- **Confidence Index** (blended stability + streak + speed)

### Example scoring formula

```ts
confidenceIndex = Math.round(
  0.35 * normalizedAccuracy +
  0.25 * normalizedSpeed +
  0.20 * normalizedConsistency +
  0.20 * normalizedConceptClarity
);
```

---

## 8) Recommendation Engine (Closure Assistance)

```ts
if (speedScore < 50) recommend("Mental Maths Accelerator");
if (conceptScore < 50) recommend("Foundation Builder Program");
if (applicationScore < 50) recommend("Advanced Reasoning Track");
```

Output includes:
- Top strengths
- Key gaps
- Program recommendation
- Auto-generated counsellor talking points

---

## 9) API Surface (v1)

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Sessions
- `POST /api/v1/sessions` (create)
- `POST /api/v1/sessions/:id/start`
- `POST /api/v1/sessions/:id/answer`
- `GET /api/v1/sessions/:id`
- `GET /api/v1/sessions?studentName=&grade=&createdBy=`

### Reports
- `GET /api/v1/reports/:sessionId`
- `GET /api/v1/reports/:sessionId/pdf`

### Admin
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/counsellors/:id/performance`

### Sockets
- `session:join`
- `question:serve`
- `answer:submitted`
- `score:update`
- `session:completed`

---

## 10) Frontend Experience Blueprint

### Counsellor journey
1. Login.
2. Start session (grade + student name).
3. Live game screen with timer, score, streak, encouragement.
4. Instant report screen with charts and summary.
5. Download PDF + share recommendation.

### UI requirements implementation
- White background + blue/green accents (Tailwind theme tokens).
- Big typography for numbers/timers.
- Circular animated timer (`Framer Motion`).
- Responsive layouts for laptop/tablet.

---

## 11) Security & Multi-Tenant SaaS Design

- JWT access + refresh token flow.
- Role-based middleware for `COUNSELLOR` and `ADMIN`.
- `organizationId` attached to every protected query.
- Password hashing with `bcrypt`.
- API rate limiting + helmet + CORS hardening.
- Audit logs for session updates and report generation.

---

## 12) Production Readiness Checklist

- [ ] Input validation (Zod/Joi) on all endpoints.
- [ ] Centralized error handling.
- [ ] Structured logging (pino/winston).
- [ ] Health checks (`/healthz`, `/readyz`).
- [ ] Idempotency for answer submission.
- [ ] Retry-safe socket reconnect strategy.
- [ ] Monitoring (Prometheus/Grafana or hosted APM).
- [ ] Backups and data retention policy.

---

## 13) DevOps and Deployment

### `.env.example`
```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://mongo:27017/math_rapid_fire
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

### Minimal `docker-compose.yml`
```yaml
version: "3.9"
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  api:
    build: ./apps/api
    env_file: .env
    ports: ["4000:4000"]
    depends_on: [mongo]

  web:
    build: ./apps/web
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [api]

volumes:
  mongo_data:
```

### Build scripts
- `npm run dev` (parallel web + api)
- `npm run build`
- `npm run test`
- `npm run lint`

---

## 14) Implementation Plan (Execution Sequence)

1. **Bootstrap monorepo** (apps/web, apps/api, shared packages).
2. **Auth + RBAC** (JWT, protected routes).
3. **Question bank service** (grade + difficulty tags).
4. **Session engine** (round orchestration + timers).
5. **Adaptive logic** (difficulty progression persistence).
6. **Analytics + NLP scoring**.
7. **Counsellor dashboard charts + report summary**.
8. **PDF export + recommendation module**.
9. **Admin analytics panel**.
10. **Dockerize + observability + staging deployment**.

---

## 15) Monetisation-Ready Extensions

- Subscription tiers by seats/sessions.
- Organization-level white labeling.
- Advanced AI insights add-on.
- CRM integration for lead closure tracking.
- Cohort benchmarking reports.

---

## 16) Suggested Next Deliverables

- Investor pitch deck narrative + KPI model.
- 12-month product roadmap with release milestones.
- Pricing strategy (B2B school/counsellor bundles).
- Wireframes for counsellor flow and report screen.
