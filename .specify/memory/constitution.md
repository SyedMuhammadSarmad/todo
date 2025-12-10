<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (6 principles)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible
  - .specify/templates/spec-template.md: ✅ Compatible
  - .specify/templates/tasks-template.md: ✅ Compatible
Follow-up TODOs: None
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

### II. In-Memory Storage (Phase 1)

Phase 1 application MUST store all data in memory only.

- No external databases, files, or persistent storage in Phase 1
- Data structures MUST be simple Python collections (lists, dictionaries)
- Application state resets on restart (acceptable for Phase 1)
- Design MUST allow easy transition to persistent storage in Phase 2

**Rationale**: Phase 1 focuses on core logic and CLI interface without infrastructure complexity.

### III. Clean Code & Project Structure

Code MUST follow Python best practices and maintain clear organization.

- Use UV as the Python package manager
- Target Python 3.13+
- Source code lives in `/src` directory
- Follow PEP 8 style guidelines
- Use type hints for all function signatures
- Keep functions small and focused (single responsibility)

**Rationale**: Clean code enables easier evolution through subsequent phases and demonstrates professional practices.

### IV. CLI-First Interface

All functionality MUST be accessible via command-line interface.

- Text in/out protocol: args → stdout, errors → stderr
- Support human-readable output format
- Provide clear help messages and usage instructions
- Commands MUST be intuitive and well-documented

**Rationale**: Phase 1 is a console application; CLI is the primary user interface.

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

## Technology Stack

### Phase 1 Requirements

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
| Phase 2 | Next.js, FastAPI, SQLModel, Neon DB, Better Auth |
| Phase 3 | OpenAI ChatKit, Agents SDK, MCP SDK |
| Phase 4 | Docker, Minikube, Helm, kubectl-ai |
| Phase 5 | Kafka, Dapr, DigitalOcean DOKS |

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

**Version**: 1.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-10
