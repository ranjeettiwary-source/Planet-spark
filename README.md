# Math Rapid Fire Pro (Working MVP)

Production-style backend for live counselling assessments with:
- Role-based authentication (Counsellor/Admin)
- Session creation + round engine
- Adaptive difficulty progression
- Explanation clarity scoring
- Analytics and recommendations
- Report endpoint + exportable text report
- Admin overview analytics

## Tech
- Node.js (native `http`, ESM)
- No external runtime dependencies required
- Automated tests via `node --test`

## Quick Start

```bash
npm install
npm test
npm start
```

API starts on `http://localhost:4000`.

## Demo Credentials

- Counsellor: `counsellor@demo.com` / `password123`
- Admin: `admin@demo.com` / `password123`

## Implemented Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/sessions`
- `POST /api/v1/sessions/:id/start`
- `POST /api/v1/sessions/:id/answer`
- `GET /api/v1/sessions/:id`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id/events`
- `GET /api/v1/reports/:id`
- `GET /api/v1/reports/:id/pdf`
- `GET /api/v1/admin/overview`

## Architecture

```txt
src/
├─ app.js                         # API router
├─ server.js                      # server bootstrap
├─ config/env.js
├─ core/
│  ├─ http.js                     # JSON parser/responders
│  └─ store.js                    # in-memory data store
├─ modules/
│  ├─ auth/
│  │  ├─ auth.controller.js
│  │  ├─ auth.middleware.js
│  │  └─ auth.service.js
│  ├─ sessions/
│  │  ├─ questionBank.js
│  │  └─ sessions.service.js
│  ├─ adaptive/adaptive.engine.js
│  ├─ explanations/nlp.scorer.js
│  ├─ analytics/analytics.service.js
│  ├─ recommendations/recommendation.engine.js
│  ├─ reports/pdf.service.js
│  └─ admin/admin.service.js
└─ utils/
   ├─ token.js                    # JWT-like HMAC token
   └─ hash.js                     # PBKDF2 password hashing
```

## Notes
- This build is fully runnable and tested.
- Data persistence is in-memory for local validation; swapping `core/store.js` with DB repositories is the next step.
