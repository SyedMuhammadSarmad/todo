---
id: 002
title: Update constitution for Phase 2
stage: constitution
date: 2025-12-11
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-todo-console-app
user: user
command: constitution update
labels: ["constitution", "phase-2", "architecture", "full-stack", "database"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - CLAUDE.md
tests:
  - None (constitutional document)
---

## Prompt

how would you start working on phase 2 since phase 1 is complete @"Hackathon II - Todo Spec-Driven Development.md"

## Response snapshot

Updated constitution from v1.0.0 to v2.0.0 (MAJOR version) to formalize Phase 2 requirements.

**Modified Principles:**
- II. In-Memory Storage → Database Persistence & Multi-User Isolation
  - Added Neon PostgreSQL, SQLModel requirements
  - Enforced user isolation at database query level
  - Required versioned, reversible migrations

- IV. CLI-First Interface → Full-Stack Web Application
  - Frontend: Next.js 16+ with App Router
  - Backend: FastAPI with RESTful JSON API
  - Required responsive UI and API documentation

**Added New Principles:**
- VII. API Design Principles
  - Resource-based URLs, HTTP method conventions
  - Standardized status codes and error handling
  - User context in all endpoint paths

- VIII. Authentication & Security
  - Better Auth with JWT tokens
  - Shared secret between frontend/backend
  - User isolation and token verification

- IX. Monorepo Organization
  - Defined folder structure (frontend/, backend/, specs/)
  - Three-level CLAUDE.md guidance (root, frontend, backend)
  - Organized spec structure (features/, api/, database/, ui/)

**Technology Stack Updates:**
- Made Phase 2 the active stack
- Moved Phase 1 to "completed" status
- Added environment variable requirements
- Added Docker/docker-compose for local development

**Root CLAUDE.md Updates:**
- Updated Active Technologies section for Phase 2
- Documented recent constitutional changes
- Maintained Phase 1 context for reference

## Outcome

- ✅ Impact: Constitution successfully evolved to support full-stack web architecture
- 🧪 Tests: N/A (constitutional document)
- 📁 Files: Updated `.specify/memory/constitution.md` (v2.0.0) and `CLAUDE.md`
- 🔁 Next prompts:
  1. Create Phase 2 specifications using `/sp.specify`
  2. Set up monorepo structure (frontend/, backend/, .spec-kit/)
  3. Create architecture.md documenting system design decisions
- 🧠 Reflection: MAJOR version bump appropriate due to fundamental architectural changes (storage, interface, multi-user). Breaking changes properly documented in sync impact report.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): Standard constitutional update workflow
- Next experiment (smallest change to try): Create specs/ folder structure and begin Phase 2 specification development
