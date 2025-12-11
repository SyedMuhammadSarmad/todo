# Todo App - Evolution from Console to Cloud

[![Phase 2](https://img.shields.io/badge/Phase-2%20Web%20App-blue)](https://github.com/yourusername/todo-hackathon)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688)](https://fastapi.tiangolo.com/)

> **Hackathon II**: Mastering Spec-Driven Development & Cloud Native AI

A multi-phase project demonstrating the evolution of a simple todo application from a console app to a production-ready, cloud-native AI chatbot deployed on Kubernetes.

---

## 🎯 Current Phase: Phase 2 - Full-Stack Web Application

**Status**: 🚧 In Progress
**Due Date**: December 14, 2025
**Points**: 150/1000

### Phase 2 Objectives

Transform the Phase 1 console application into a modern multi-user web application with:

✅ **Persistent Storage**: Neon Serverless PostgreSQL
✅ **Web Interface**: Next.js 16+ with App Router
✅ **RESTful API**: FastAPI backend
✅ **Authentication**: Better Auth with JWT tokens
✅ **Multi-User Support**: Complete user isolation

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth with JWT
- **State Management**: React Server Components

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.13+
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Package Manager**: UV
- **Authentication**: JWT verification

### Development
- **Monorepo**: Frontend + Backend in one repository
- **Container**: Docker + docker-compose
- **Spec-Driven**: Claude Code + Spec-Kit Plus

---

## 📁 Project Structure

```
/mnt/d/AI-agents/2/          # Monorepo root
├── .spec-kit/               # Spec-Kit Plus configuration
│   └── config.yaml          # Phase definitions
│
├── specs/                   # Specifications by phase
│   ├── phase-1/             # Phase 1 (completed)
│   └── phase-2/             # Phase 2 (active)
│       ├── overview.md
│       ├── architecture.md
│       ├── features/        # Feature specs
│       ├── api/             # API specs
│       ├── database/        # DB schema
│       └── ui/              # UI specs
│
├── archived/                # Completed phases
│   └── phase-1-console/     # Phase 1 console app
│
├── frontend/                # Next.js application
│   └── CLAUDE.md            # Frontend guidelines
│
├── backend/                 # FastAPI application
│   └── CLAUDE.md            # Backend guidelines
│
├── history/                 # Development history
│   ├── prompts/             # Prompt History Records
│   └── adr/                 # Architecture Decision Records
│
├── docker-compose.yml       # Local development
├── .env.example             # Environment template
├── CLAUDE.md                # Root navigation guide
└── README.md                # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python**: 3.13+ ([Download](https://www.python.org/downloads/))
- **Node.js**: 20+ ([Download](https://nodejs.org/))
- **UV**: Python package manager ([Install](https://github.com/astral-sh/uv))
- **Neon Account**: Free tier ([Sign up](https://neon.tech))
- **Docker** (optional): For containerized development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/todo-hackathon.git
cd todo-hackathon
```

### 2. Set Up Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in your values:
# - DATABASE_URL (from Neon dashboard)
# - BETTER_AUTH_SECRET (generate with: openssl rand -base64 32)
```

### 3. Set Up Backend

```bash
cd backend

# Install dependencies
uv sync

# Run migrations (creates database tables)
uv run python -c "from db import init_db; init_db()"

# Start development server
uv run uvicorn main:app --reload
# Backend runs on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### 4. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

### 5. Using Docker (Alternative)

```bash
# From project root
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 📚 Development Workflow

This project follows **Spec-Driven Development (SDD)**:

### 1. Create Specifications

```bash
/sp.specify
```

Define **what** to build (user stories, acceptance criteria)

### 2. Plan Architecture

```bash
/sp.plan
```

Design **how** to build it (system architecture, decisions)

### 3. Generate Tasks

```bash
/sp.tasks
```

Break down into **actionable tasks** with test cases

### 4. Implement

```bash
/sp.implement
```

Execute tasks with Claude Code

### 5. Document

Prompt History Records (PHRs) are created automatically in `history/prompts/`

---

## 🎯 Phase Progression

| Phase | Status | Description | Tech Stack | Due Date |
|-------|--------|-------------|------------|----------|
| **Phase 1** | ✅ Complete | Console App | Python, In-Memory | Dec 7 |
| **Phase 2** | 🚧 Active | Web App | Next.js, FastAPI, Neon | Dec 14 |
| **Phase 3** | 📅 Planned | AI Chatbot | OpenAI SDK, MCP | Dec 21 |
| **Phase 4** | 📅 Planned | Kubernetes | Docker, Minikube, Helm | Jan 4 |
| **Phase 5** | 📅 Planned | Cloud Deploy | Kafka, Dapr, DOKS | Jan 18 |

### Viewing Previous Phases

```bash
# View Phase 1 (console app)
cd archived/phase-1-console
cat README.md

# Or checkout Phase 1 git tag
git checkout v1.0-phase1

# Return to current phase
git checkout main
```

---

## 🔑 Features (Phase 2)

### Basic Level (All 5 Implemented)

- [ ] **Add Task** - Create tasks with title and description
- [ ] **View Tasks** - Display all user tasks in responsive UI
- [ ] **Update Task** - Edit existing task details
- [ ] **Delete Task** - Remove tasks with confirmation
- [ ] **Mark Complete** - Toggle completion status

### Authentication

- [ ] **Sign Up** - Create new user account
- [ ] **Sign In** - Authenticate with JWT
- [ ] **Sign Out** - End user session

### Multi-User

- [ ] **User Isolation** - Each user sees only their own tasks
- [ ] **JWT Protection** - All API endpoints secured
- [ ] **Database Filtering** - Queries filtered by user_id

---

## 📖 API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: TBD

### Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List all tasks |
| POST | `/api/{user_id}/tasks` | Create new task |
| GET | `/api/{user_id}/tasks/{id}` | Get task details |
| PUT | `/api/{user_id}/tasks/{id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completion |

**Full API Docs**: http://localhost:8000/docs (Swagger UI)

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
uv run pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 📦 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

### Backend (TBD)

Options:
- Railway
- Render
- DigitalOcean App Platform

---

## 🤝 Contributing

This is a hackathon project following strict Spec-Driven Development:

1. **All code MUST be generated via Claude Code**
2. **Specs MUST be written before code**
3. **No manual code writing** (refine specs instead)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **Hackathon**: Panaversity, PIAIC, GIAIC
- **Framework**: Next.js, FastAPI
- **Database**: Neon
- **AI**: Claude Code (Anthropic)

---

## 📞 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Demo Video**: [YouTube Link](https://youtube.com/watch?v=...)
- **Live App**: [Vercel URL](https://your-app.vercel.app)

---

**Made with ❤️ using Spec-Driven Development and Claude Code**

*Hackathon II: Evolution of Todo - Mastering Spec-Driven Development & Cloud Native AI*
