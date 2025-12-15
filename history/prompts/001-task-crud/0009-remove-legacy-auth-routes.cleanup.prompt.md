---
id: 0009
title: remove-legacy-auth-routes
stage: cleanup
date: 2025-12-15
surface: agent
model: gemini-2.0-flash-exp
feature: 001-task-crud
branch: 001-task-crud
user: smsar
command: interactive
labels: ["cleanup", "refactor", "routes"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/app/main.py
 - backend/app/routers/auth.py
tests:
 - manual verification
---

## Prompt

if authentication is handle at frontend from better auth then why fast api has authentiction routes

## Response snapshot

You are correct; the `backend/app/routers/auth.py` routes (`/signup`, `/signin`, etc.) were vestigial artifacts from an earlier implementation plan. Since Better Auth now handles the full authentication lifecycle (frontend -> Next.js API routes -> Database), the FastAPI backend only requires the *session verification* logic (implemented in `dependencies.py`).

Actions taken:
1. Removed `app.include_router(auth.router)` from `backend/app/main.py`.
2. Deleted `backend/app/routers/auth.py` to remove the dead code.

## Outcome

- ✅ Impact: Reduced codebase size and removed misleading/unused endpoints.
- 🧪 Tests: Confirmed server starts without the auth router.
- 📁 Files: `backend/app/main.py`, `backend/app/routers/auth.py` (deleted)
- 🔁 Next prompts: Continue task CRUD.
- 🧠 Reflection: Regular code pruning is essential when architectural decisions shift (e.g., switching from custom auth to a library).

## Evaluation notes (flywheel)

- Failure modes observed: N/A
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
