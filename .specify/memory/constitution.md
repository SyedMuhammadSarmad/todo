<!--
Sync Impact Report
==================
Version change: 1.0.0 → 2.0.0
Modified principles:
  - II. In-Memory Storage (Phase 1) → Database Persistence & Multi-User Isolation (Phase 2)
  - IV. CLI-First Interface → Full-Stack Web Application (Phase 2)
Added sections:
  - VII. API Design Principles
  - VIII. Authentication & Security
  - IX. Monorepo Organization
  - Phase 2 Active Technology Stack
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible
  - .specify/templates/spec-template.md: ✅ Compatible
  - .specify/templates/tasks-template.md: ✅ Compatible
Breaking changes:
  - Storage model changes from in-memory to persistent database
  - Interface changes from CLI to web application
  - Single-user to multi-user architecture
Follow-up TODOs:
  - Create Phase 2 specifications
  - Set up monorepo structure
  - Configure Neon DB instance
-->

# Todo Hackathon Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

All code MUST be generated through specification-driven development using Claude Code and Spec-Kit Plus.

- Every feature starts with a written specification before any code is written
- Code MUST NOT be written manually; refine the spec until Claude Code generates correct output
- Specifications live in `specs/<phase>/` directories
- Changes to requirements MUST update specs first, then regenerate code

**Rationale**: The hackathon explicitly requires spec-driven development as a core learning objective. Manual code writing violates submission requirements.

### II. Database Persistence & Multi-User Isolation (Phase 2)

Phase 2 application MUST store all data persistently and enforce strict user isolation.

- Use Neon Serverless PostgreSQL as the primary database
- Use SQLModel as ORM for type-safe database operations
- Each user MUST only access their own tasks (enforced at database query level)
- Database schema MUST support multi-tenancy with user_id foreign keys
- All queries MUST filter by authenticated user_id
- Database migrations MUST be versioned and reversible

**Rationale**: Multi-user web applications require persistent storage and strict data isolation for security and compliance.

**Phase 1 Context**: Previously used in-memory storage (Python collections). Data was ephemeral and single-user.

### III. Clean Code & Project Structure

Code MUST follow Python best practices and maintain clear organization.

- Use UV as the Python package manager
- Target Python 3.13+
- Source code lives in `/src` directory
- Follow PEP 8 style guidelines
- Use type hints for all function signatures
- Keep functions small and focused (single responsibility)

**Rationale**: Clean code enables easier evolution through subsequent phases and demonstrates professional practices.

### IV. Full-Stack Web Application (Phase 2)

All functionality MUST be accessible via web interface with RESTful API backend.

- **Frontend**: Next.js 16+ using App Router architecture
- **Backend**: Python FastAPI exposing RESTful JSON API
- **API Contract**: Well-defined endpoints with typed request/response models
- **Responsive UI**: Mobile-first design principles
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Error Handling**: Standardized HTTP status codes and error messages

**Rationale**: Phase 2 transitions to multi-user web application accessible from browsers.

**Phase 1 Context**: Previously CLI-only interface with text in/out protocol.

### V. Incremental Evolution

Each phase builds upon the previous without breaking existing functionality.

- Phase 1 establishes core domain logic (Task model, CRUD operations)
- Code MUST be structured to allow adding persistence (Phase 2)
- Code MUST be structured to allow adding API layer (Phase 2)
- Code MUST be structured to allow adding AI integration (Phase 3)

**Rationale**: The hackathon is designed as an evolutionary journey from console app to cloud-native AI system.

### VI. Simplicity & YAGNI

Start simple; add complexity only when required by current phase.

- No premature optimization
- No features beyond current phase requirements
- Prefer standard library over external dependencies when possible
- Three similar lines of code is better than a premature abstraction

**Rationale**: Complexity grows naturally through phases; over-engineering early creates technical debt.

### VII. API Design Principles (Phase 2)

RESTful API MUST follow industry-standard conventions and be self-documenting.

- **Resource-Based URLs**: `/api/{user_id}/tasks` not `/api/getTasks`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete), PATCH (partial update)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- **Request/Response**: JSON format with Pydantic models for validation
- **User Context**: All endpoints MUST include `{user_id}` in path for explicit user context
- **Idempotency**: PUT and DELETE operations MUST be idempotent
- **Versioning**: API paths MUST include `/api/` prefix for future versioning

**Rationale**: Consistent API design reduces integration errors and improves developer experience.

### VIII. Authentication & Security (Phase 2)

Authentication MUST be implemented with JWT tokens; all endpoints MUST be secured.

- **Frontend Auth**: Better Auth library with JWT plugin enabled
- **Backend Auth**: JWT verification middleware on all protected routes
- **Shared Secret**: Same `BETTER_AUTH_SECRET` environment variable in frontend and backend
- **Token Flow**: Frontend includes `Authorization: Bearer <token>` header on every API request
- **User Isolation**: Backend extracts user_id from JWT and validates against URL path parameter
- **No Secrets in Code**: All credentials MUST be in `.env` files (excluded from git)
- **Password Security**: Better Auth handles password hashing; never store plaintext passwords

**Rationale**: Security-first design prevents data breaches and ensures regulatory compliance.

### IX. Monorepo Organization (Phase 2)

Code MUST be organized in a monorepo structure with clear separation of concerns.

- **Root Structure**:
  - `.spec-kit/` - SpecKit Plus configuration
  - `specs/` - Organized specifications (features/, api/, database/, ui/)
  - `frontend/` - Next.js application with its own CLAUDE.md
  - `backend/` - FastAPI application with its own CLAUDE.md
  - `docker-compose.yml` - Local development orchestration
  - `CLAUDE.md` - Root-level navigation and workflow guide

- **CLAUDE.md Files**: Provide context at three levels
  - Root: Project overview, workflow, how to use specs
  - Frontend: Next.js patterns, component structure, API client usage
  - Backend: FastAPI patterns, database operations, API conventions

- **Spec Organization**:
  - `specs/overview.md` - Project status and current phase
  - `specs/architecture.md` - System design and technology decisions
  - `specs/features/*.md` - User stories and acceptance criteria
  - `specs/api/*.md` - API endpoint specifications
  - `specs/database/*.md` - Schema and data models
  - `specs/ui/*.md` - Component and page specifications

**Rationale**: Monorepo enables Claude Code to see entire project context and make cross-cutting changes atomically.

## Technology Stack

### Phase 2 Active Requirements

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16+ (App Router) | React-based web framework |
| **Frontend Auth** | Better Auth | Latest | Authentication with JWT support |
| **Frontend Styling** | Tailwind CSS | Latest | Utility-first CSS framework |
| **Backend** | Python FastAPI | Latest | High-performance API framework |
| **Backend ORM** | SQLModel | Latest | Type-safe database operations |
| **Database** | Neon Serverless PostgreSQL | Latest | Managed PostgreSQL database |
| **Package Manager (Backend)** | UV | Latest | Fast Python package manager |
| **Package Manager (Frontend)** | npm/pnpm | Latest | Node.js package manager |
| **Development** | Claude Code + Spec-Kit Plus | Latest | Spec-driven development tools |
| **Containerization** | Docker + docker-compose | Latest | Local development environment |

### Environment Configuration

Required environment variables:

**Backend (.env in /backend)**
```
DATABASE_URL=postgresql://user:password@host/db
BETTER_AUTH_SECRET=shared-secret-key-min-32-chars
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env.local in /frontend)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=shared-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### Phase 1 Technologies (Completed)

| Component | Technology |
|-----------|------------|
| Language | Python 3.13+ |
| Package Manager | UV |
| Storage | In-memory (Python collections) |
| Interface | Command-line (CLI) |
| Development | Claude Code + Spec-Kit Plus |

### Future Phase Technologies (Reference Only)

| Phase | Additional Stack |
|-------|------------------|
| Phase 3 | OpenAI ChatKit, Agents SDK, Official MCP SDK |
| Phase 4 | Docker, Minikube, Helm, kubectl-ai, kagent |
| Phase 5 | Kafka (Redpanda Cloud), Dapr, DigitalOcean DOKS |

## Development Workflow

### Spec-Driven Cycle

1. **Specify**: Write feature specification (`/sp.specify`)
2. **Plan**: Generate implementation plan (`/sp.plan`)
3. **Tasks**: Create actionable task list (`/sp.tasks`)
4. **Implement**: Execute tasks via Claude Code (`/sp.implement`)
5. **Record**: Document in PHR (automatic)

### Required Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Constitution | `.specify/memory/constitution.md` | Project principles |
| Specs | `specs/<phase>/spec.md` | Feature requirements |
| Plans | `specs/<phase>/plan.md` | Implementation design |
| Tasks | `specs/<phase>/tasks.md` | Actionable work items |
| PHRs | `history/prompts/` | Prompt history records |
| ADRs | `history/adr/` | Architecture decisions |

### Git Practices

- Commit after completing each logical task
- Use descriptive commit messages
- Push to remote repository regularly
- Main branch MUST always be in working state

## Governance

### Amendment Process

1. Propose change with rationale
2. Update constitution with new version
3. Propagate changes to dependent templates
4. Document in PHR

### Versioning Policy

- **MAJOR**: Backward-incompatible principle changes
- **MINOR**: New principles or sections added
- **PATCH**: Clarifications and typo fixes

### Compliance

- All code generation MUST reference current constitution
- Spec violations MUST be justified in Complexity Tracking
- Constitution principles override default agent behavior

**Version**: 2.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-11
