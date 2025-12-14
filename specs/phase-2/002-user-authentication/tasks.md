# Tasks: User Authentication

**Feature**: User Authentication
**Branch**: `002-user-authentication`
**Input**: Design documents from `/specs/phase-2/002-user-authentication/`
**Prerequisites**: plan.md, spec.md (from features/authentication.md), research.md, data-model.md, contracts/auth-api.md

**Tests**: No explicit test requirements in specification - focus on functional implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/` and `frontend/` directories at repository root
- Backend: `backend/app/` for application code
- Frontend: `frontend/src/` for source code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and authentication library setup

**Note**: If monorepo already exists from task-crud feature, skip T001-T004

- [X] T001 Verify monorepo structure with backend/ and frontend/ directories exists
- [X] T002 [P] Install Better Auth package in frontend/ (npm install better-auth)
- [X] T003 [P] Install JWT and password hashing packages in backend/ (pyjwt, passlib, bcrypt)
- [X] T004 [P] Add BETTER_AUTH_SECRET to both backend/.env and frontend/.env.local
- [X] T005 [P] Add JWT_SECRET and JWT_ALGORITHM to backend/.env
- [X] T006 [P] Configure PASSWORD_HASH_ROUNDS in backend/.env (default: 12)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T007 Create User model (id, email, password_hash, created_at, updated_at, last_signin_at) in backend/app/models/user.py
- [X] T008 [P] Create Session model (optional - for audit logging) in backend/app/models/session.py
- [X] T009 Create Alembic migration 001_create_users_table.py for users table with unique email index
- [X] T010 [P] Create Alembic migration 002_create_sessions_table.py (optional) for sessions table
- [X] T011 Run database migrations to create users and sessions tables in Neon PostgreSQL
- [X] T012 Create password hashing utility functions (hash_password, verify_password) in backend/app/utils/password.py
- [X] T013 Create JWT utility functions (create_access_token, verify_token) in backend/app/utils/jwt.py
- [X] T014 Create JWT authentication dependency function (get_current_user) in backend/app/dependencies.py
- [X] T015 Create rate limiting middleware for signin attempts in backend/app/middleware/rate_limit.py
- [X] T016 Create auth router structure in backend/app/routers/auth.py with empty endpoints
- [X] T017 Register auth router in backend/app/main.py
- [X] T018 [P] Configure CORS middleware to allow frontend origin in backend/app/main.py (if not done)

### Frontend Foundation

- [ ] T019 [P] Create Better Auth configuration in frontend/src/lib/auth.ts with JWT plugin
- [X] T020 [P] Create auth API client functions (signup, signin, signout, getSession) in frontend/lib/api/auth.ts
- [X] T021 [P] Create User TypeScript interface in frontend/types/user.ts
- [X] T022 [P] Create Zod validation schemas for signup and signin forms in frontend/lib/validations/auth.ts
- [X] T023 [P] Create AuthContext for managing auth state in frontend/contexts/AuthContext.tsx
- [X] T024 [P] Create useAuth custom hook in frontend/hooks/useAuth.ts
- [X] T025 Wrap Next.js app with AuthProvider in frontend/app/layout.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Account (Signup) (Priority: P1) 🎯 MVP

**Goal**: Enable new users to create accounts with email and password, providing the entry point for using the todo application

**Independent Test**: Navigate to signup page, enter valid email and password (min 8 chars, 1 letter, 1 number), submit form, and verify account is created, user is automatically signed in, and redirected to the application

**Acceptance Criteria**:
- New users can create accounts with email and password
- Email format validation enforced
- Password requirements enforced (min 8 chars, 1 letter, 1 number)
- Error shown if email already exists
- Password stored securely (hashed with bcrypt)
- User automatically signed in after signup
- Success message and redirect to main application

### Implementation for User Story 1

#### Backend Implementation

- [X] T026 [US1] Implement POST /api/auth/signup endpoint in backend/app/routers/auth.py
- [X] T027 [US1] Add Pydantic schema for SignupRequest (email, password) with field validation
- [X] T028 [US1] Add email format validation using regex pattern
- [X] T029 [US1] Add password complexity validation (min 8, letter, number)
- [X] T030 [US1] Check for duplicate email in database (return 409 if exists)
- [X] T031 [US1] Hash password using bcrypt (via hash_password utility)
- [X] T032 [US1] Create user record in database with generated ID
- [X] T033 [US1] Generate JWT token with user ID in payload
- [X] T034 [US1] Return 201 Created with user data (excluding password_hash) and JWT token
- [X] T035 [US1] Add error handling for database errors and validation failures

#### Frontend Implementation

- [X] T036 [P] [US1] Create SignupForm component with React Hook Form in frontend/components/auth/SignupForm.tsx
- [X] T037 [P] [US1] Add email and password input fields with client-side validation
- [X] T038 [P] [US1] Add password strength indicator UI component
- [X] T039 [P] [US1] Display inline validation errors for email and password
- [X] T040 [US1] Create signup page in frontend/app/signup/page.tsx
- [X] T041 [US1] Wire SignupForm to signup API client function
- [X] T042 [US1] Store JWT token in localStorage on successful signup
- [X] T043 [US1] Update AuthContext with user data and authentication state
- [X] T044 [US1] Redirect to dashboard/main application after successful signup
- [X] T045 [US1] Display error toast for duplicate email error (409)
- [X] T046 [US1] Display error toast for validation failures (400)
- [X] T047 [US1] Add loading state to signup button during API call
- [X] T048 [US1] Test signup flow end-to-end (form → API → database → redirect)

**Checkpoint**: At this point, User Story 1 should be fully functional - new users can create accounts

---

## Phase 4: User Story 2 - Sign In to Existing Account (Priority: P2)

**Goal**: Enable returning users to sign in with their existing credentials to access their saved tasks

**Independent Test**: Create an account, sign out, navigate to signin page, enter correct email and password, submit form, and verify user is authenticated and redirected to their task list

**Acceptance Criteria**:
- Existing users can sign in with email and password
- Correct credentials authenticate successfully
- JWT token issued on successful signin
- Session persists across page refreshes
- Generic error message for incorrect credentials (don't reveal which field was wrong)
- Rate limiting prevents brute force attacks (max 5 attempts/minute)
- last_signin_at timestamp updated on successful signin

### Implementation for User Story 2

#### Backend Implementation

- [ ] T049 [US2] Implement POST /api/auth/signin endpoint in backend/app/routers/auth.py
- [ ] T050 [US2] Add Pydantic schema for SigninRequest (email, password)
- [ ] T051 [US2] Query database for user by email
- [ ] T052 [US2] Return generic 401 error if user not found (don't reveal email doesn't exist)
- [ ] T053 [US2] Verify password using verify_password utility function
- [ ] T054 [US2] Return generic 401 error if password incorrect
- [ ] T055 [US2] Apply rate limiting middleware (5 attempts/minute per email)
- [ ] T056 [US2] Return 429 Too Many Requests if rate limit exceeded
- [ ] T057 [US2] Update user's last_signin_at timestamp on successful authentication
- [ ] T058 [US2] Generate JWT token with user ID and expiration (7 days)
- [ ] T059 [US2] Optionally create session record in sessions table for audit logging
- [ ] T060 [US2] Return 200 OK with user data and JWT token
- [ ] T061 [US2] Add error handling for database errors

#### Frontend Implementation

- [ ] T062 [P] [US2] Create SigninForm component with React Hook Form in frontend/src/components/auth/SigninForm.tsx
- [ ] T063 [P] [US2] Add email and password input fields
- [ ] T064 [P] [US2] Add "Remember me" checkbox (optional enhancement)
- [ ] T065 [US2] Create signin page in frontend/src/app/signin/page.tsx
- [ ] T066 [US2] Wire SigninForm to signin API client function
- [ ] T067 [US2] Store JWT token in localStorage or cookies on successful signin
- [ ] T068 [US2] Update AuthContext with user data and authentication state
- [ ] T069 [US2] Redirect to dashboard after successful signin
- [ ] T070 [US2] Display error toast for invalid credentials (401)
- [ ] T071 [US2] Display error toast for rate limit exceeded (429)
- [ ] T072 [US2] Add loading state to signin button during API call
- [ ] T073 [US2] Add "Don't have an account? Sign up" link to signup page
- [ ] T074 [US2] Test signin flow with correct and incorrect credentials
- [ ] T075 [US2] Test rate limiting by attempting multiple failed signins

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can signup and signin

---

## Phase 5: User Story 3 - Sign Out (Priority: P3)

**Goal**: Enable users to sign out of their account to protect their data on shared/public devices

**Independent Test**: Sign in to an account, click the signout button, verify session is terminated, and attempt to access a protected page to confirm redirect to signin page

**Acceptance Criteria**:
- Signed-in users can sign out from any authenticated page
- Session is terminated on signout
- JWT token is invalidated/removed from client
- User redirected to signin page after signout
- Protected pages inaccessible after signout
- Success message shown after signout
- Browser back button cannot access authenticated pages after signout

### Implementation for User Story 3

#### Backend Implementation

- [ ] T076 [US3] Implement POST /api/auth/signout endpoint in backend/app/routers/auth.py
- [ ] T077 [US3] Add JWT authentication dependency to signout endpoint (require valid token)
- [ ] T078 [US3] Optionally invalidate session in sessions table by deleting record
- [ ] T079 [US3] Return 200 OK with signout success message
- [ ] T080 [US3] Add error handling for invalid/expired tokens (401)

#### Frontend Implementation

- [ ] T081 [US3] Add signout function to auth API client in frontend/src/lib/api/auth.ts
- [ ] T082 [US3] Create signout button component in frontend/src/components/auth/SignoutButton.tsx
- [ ] T083 [US3] Add signout button to navigation/header component
- [ ] T084 [US3] Call signout API endpoint when button clicked
- [ ] T085 [US3] Remove JWT token from localStorage or cookies on signout
- [ ] T086 [US3] Clear user data from AuthContext state
- [ ] T087 [US3] Redirect to signin page after successful signout
- [ ] T088 [US3] Display success toast "You have been signed out successfully"
- [ ] T089 [US3] Create ProtectedRoute component to guard authenticated pages in frontend/src/components/auth/ProtectedRoute.tsx
- [ ] T090 [US3] Wrap protected pages (dashboard, tasks) with ProtectedRoute
- [ ] T091 [US3] Redirect to signin page if user tries to access protected page without authentication
- [ ] T092 [US3] Test signout flow and verify protected pages redirect to signin

**Checkpoint**: All authentication flows now work - signup, signin, and signout

---

## Phase 6: User Story 4 - Session Management and Security (Priority: P4)

**Goal**: Automatically manage user sessions to maintain authentication across browser sessions while enforcing security policies

**Independent Test**: Sign in, close and reopen browser within 7 days, verify user remains signed in; sign in, wait 24+ hours without activity, verify session expires and user must sign in again

**Acceptance Criteria**:
- Sessions persist across page navigations
- Sessions persist across browser restarts for 7 days
- Sessions expire after 24 hours of inactivity
- Active users' sessions auto-refresh before expiration
- JWT token validated on every protected API request
- Users can be signed in on multiple devices concurrently
- Session expiration triggers automatic signout with notification

### Implementation for User Story 4

#### Backend Implementation

- [ ] T093 [US4] Configure JWT token expiration to 7 days in JWT utility
- [ ] T094 [US4] Add token refresh logic to extend sessions for active users
- [ ] T095 [US4] Implement session validation on all protected endpoints (via get_current_user dependency)
- [ ] T096 [US4] Add 24-hour inactivity check by comparing last_activity_at in sessions table (optional)
- [ ] T097 [US4] Return 401 Unauthorized if token is expired or invalid
- [ ] T098 [US4] Add endpoint GET /api/auth/refresh to refresh tokens before expiration (optional)
- [ ] T099 [US4] Update session last_activity_at timestamp on each authenticated request (optional)
- [ ] T100 [US4] Support concurrent sessions by allowing multiple session records per user (optional)

#### Frontend Implementation

- [ ] T101 [US4] Implement session persistence using localStorage or secure cookies
- [ ] T102 [US4] Add token to Authorization header on all API requests via axios/fetch interceptor
- [ ] T103 [US4] Create API request interceptor to handle 401 responses (token expired)
- [ ] T104 [US4] Automatically redirect to signin page when session expires
- [ ] T105 [US4] Display notification "Your session has expired. Please sign in again."
- [ ] T106 [US4] Implement GET /api/auth/session endpoint to check session validity
- [ ] T107 [US4] Call session check endpoint on app initialization to verify existing token
- [ ] T108 [US4] Restore user data in AuthContext if valid token exists
- [ ] T109 [US4] Add token refresh logic to extend sessions before expiration (optional)
- [ ] T110 [US4] Implement session refresh timer (check every 6 hours, refresh if expiring soon)
- [ ] T111 [US4] Test session persistence across browser restarts
- [ ] T112 [US4] Test session expiration after 7 days
- [ ] T113 [US4] Test concurrent sessions on multiple devices/browsers
- [ ] T114 [US4] Test automatic signout on token expiration

**Checkpoint**: All user stories (1-4) should now be independently functional - complete authentication system

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall authentication security

### Security & Validation

- [ ] T115 [P] Security audit: verify passwords never logged or exposed in API responses
- [ ] T116 [P] Security audit: verify all authentication operations use HTTPS in production
- [ ] T117 [P] Security audit: verify bcrypt rounds configured appropriately (12+)
- [ ] T118 [P] Test XSS protection in authentication forms (input sanitization)
- [ ] T119 [P] Test CSRF protection for authentication endpoints
- [ ] T120 [P] Verify rate limiting works correctly (5 attempts/minute per email)
- [ ] T121 [P] Add input sanitization to prevent SQL injection in email field
- [ ] T122 [P] Test password complexity validation with edge cases

### Performance & UX

- [ ] T123 [P] Verify signup completes in under 30 seconds (SC-001)
- [ ] T124 [P] Verify signin completes in under 10 seconds (SC-002)
- [ ] T125 [P] Verify JWT validation completes in under 100ms (SC-004)
- [ ] T126 [P] Verify signout completes within 1 second (SC-007)
- [ ] T127 [P] Add loading states to all authentication forms
- [ ] T128 [P] Add form validation feedback within 200ms
- [ ] T129 [P] Test responsive design on mobile (320px), tablet (768px), desktop (1920px)
- [ ] T130 [P] Add keyboard navigation support to all auth forms
- [ ] T131 [P] Add accessibility labels (ARIA) to all form inputs

### Documentation & Testing

- [ ] T132 [P] Add API endpoint documentation in FastAPI Swagger UI (/docs)
- [ ] T133 [P] Document JWT token structure and claims in backend/README.md
- [ ] T134 [P] Document Better Auth configuration in frontend/README.md
- [ ] T135 [P] Update backend/CLAUDE.md with authentication patterns
- [ ] T136 [P] Update frontend/CLAUDE.md with authentication patterns
- [ ] T137 [P] Run quickstart.md validation to ensure guide is accurate
- [ ] T138 [P] Create demo/test users script for development
- [ ] T139 [P] Add error logging for authentication failures (backend)
- [ ] T140 [P] Add analytics events for signup/signin/signout (optional)

### Integration Preparation

- [ ] T141 Verify user_id from JWT is available for task-crud feature
- [ ] T142 Verify get_current_user dependency can be imported by task endpoints
- [ ] T143 Test authentication flow with protected task endpoints
- [ ] T144 Create integration test: signup → create task → signout → signin → view tasks
- [ ] T145 Document authentication flow for other feature developers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 → US2 → US3 → US4
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires ability to create accounts (US1) for testing
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires ability to signin (US2) for testing
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Integrates with all previous stories for session management

### Within Each User Story

- Backend endpoints before frontend components (API must exist)
- API client functions before UI components (client functions needed by components)
- Core components before integration (forms before pages)
- User Story 1 should be complete before heavy testing of US2-US4 (need accounts to exist)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Backend and Frontend sections)
- Backend and Frontend foundational work can proceed in parallel
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel
- User Stories 3 and 4 can start in parallel after US1/US2 create accounts
- Different user stories can be worked on in parallel by different team members
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# These frontend tasks can run in parallel (different files):
Task T036: "Create SignupForm component in frontend/src/components/auth/SignupForm.tsx"
Task T037: "Add email and password input fields"
Task T038: "Add password strength indicator UI"
Task T039: "Display inline validation errors"
```

---

## Parallel Example: User Story 2

```bash
# These backend tasks can run in parallel (different responsibilities):
Task T051: "Query database for user by email"
Task T053: "Verify password using utility"
Task T055: "Apply rate limiting middleware"

# These frontend tasks can run in parallel (different files):
Task T062: "Create SigninForm component in frontend/src/components/auth/SigninForm.tsx"
Task T063: "Add email and password input fields"
Task T064: "Add remember me checkbox"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all user stories)
3. Complete Phase 3: User Story 1 (Signup)
4. Complete Phase 4: User Story 2 (Signin)
5. **STOP and VALIDATE**: Test signup and signin flows independently
6. Deploy/demo if ready (basic authentication working)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (can create accounts!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP complete - signup + signin!)
4. Add User Story 3 → Test independently → Deploy/Demo (can signout)
5. Add User Story 4 → Test independently → Deploy/Demo (full session management!)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Signup) backend
   - Developer B: User Story 1 (Signup) frontend
   - Developer C: User Story 2 (Signin) backend
   - Developer D: User Story 2 (Signin) frontend
3. After US1/US2 complete:
   - Developer A: User Story 3 (Signout)
   - Developer B: User Story 4 (Session Management)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 145
- Setup: 6 tasks
- Foundational: 19 tasks (11 backend, 7 frontend, 1 integration)
- User Story 1 (Signup): 23 tasks (10 backend, 13 frontend)
- User Story 2 (Signin): 27 tasks (13 backend, 14 frontend)
- User Story 3 (Signout): 17 tasks (5 backend, 12 frontend)
- User Story 4 (Session Management): 22 tasks (8 backend, 14 frontend)
- Polish: 31 tasks (security, performance, documentation, integration)

**Parallel Opportunities**: 58 tasks marked [P]

**Independent Test Criteria**:
- US1: Can create new accounts with email and password
- US2: Can sign in with existing credentials
- US3: Can sign out and sessions are terminated
- US4: Sessions persist and auto-manage with security policies

**Suggested MVP Scope**: User Stories 1 + 2 (Signup + Signin)

**Format Validation**: ✅ All tasks follow checklist format with checkboxes, IDs, optional [P] and [Story] labels, and file paths

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **CRITICAL**: This feature MUST be implemented BEFORE task-crud feature (dependency)
- User model and JWT middleware are prerequisites for task operations
- Verify password hashing uses bcrypt with 12+ rounds
- Test rate limiting to prevent brute force attacks
- Follow security best practices (HTTPS, XSS protection, CSRF protection)
- Sessions table is optional for basic functionality but recommended for audit logging
