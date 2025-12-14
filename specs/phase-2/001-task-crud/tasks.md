# Tasks: Task CRUD Operations

**Feature**: Task CRUD Operations
**Branch**: `001-task-crud`
**Input**: Design documents from `/specs/phase-2/001-task-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/task-api.md

**Tests**: No explicit test requirements in specification - focus on functional implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/` and `frontend/` directories at repository root
- Backend: `backend/app/` for application code
- Frontend: `frontend/src/` for source code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure setup

- [ ] T001 Create monorepo structure with backend/ and frontend/ directories
- [ ] T002 [P] Initialize FastAPI project in backend/ with UV package manager
- [ ] T003 [P] Initialize Next.js 16+ project in frontend/ with npm/pnpm
- [ ] T004 [P] Configure docker-compose.yml for local development environment
- [ ] T005 [P] Setup backend/.env with DATABASE_URL, JWT_SECRET, CORS_ORIGINS
- [ ] T006 [P] Setup frontend/.env.local with NEXT_PUBLIC_API_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. This phase depends on authentication feature (002-user-authentication) being implemented first.

**Dependencies**:
- User model/table must exist (from 002-user-authentication)
- JWT authentication middleware must exist (from 002-user-authentication)
- Better Auth must be configured (from 002-user-authentication)

### Backend Foundation

- [ ] T007 Create Task model (TaskBase, Task, TaskCreate, TaskUpdate, TaskRead) in backend/app/models/task.py
- [ ] T008 Update User model to include tasks relationship in backend/app/models/user.py
- [ ] T009 Create Alembic migration 002_create_tasks_table.py for tasks table with indexes
- [ ] T010 Run database migration to create tasks table in Neon PostgreSQL
- [ ] T011 Create task router structure in backend/app/routers/tasks.py with empty endpoints
- [ ] T012 Register task router in backend/app/main.py
- [ ] T013 [P] Create helper functions validate_user_id() and get_task_or_404() in backend/app/routers/tasks.py
- [ ] T014 [P] Configure CORS middleware to allow frontend origin in backend/app/main.py

### Frontend Foundation

- [ ] T015 [P] Create Task TypeScript interfaces in frontend/src/types/task.ts
- [ ] T016 [P] Create Zod validation schemas (taskCreateSchema, taskUpdateSchema) in frontend/src/lib/validations/task.ts
- [ ] T017 [P] Create API client functions (getTasks, getTask, createTask, updateTask, toggleTaskCompletion, deleteTask) in frontend/src/lib/api/tasks.ts
- [ ] T018 [P] Install and configure react-hot-toast for notifications in frontend/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create New Task (Priority: P1) 🎯 MVP

**Goal**: Enable users to create new tasks with a title and optional description, establishing the foundational capability for the todo application

**Independent Test**: Navigate to task creation interface, enter a valid title (1-200 characters) and optional description (max 1000 characters), submit the form, and verify the task is created with "pending" status and appears in the task list

**Acceptance Criteria**:
- User can create task with valid title (1-200 chars)
- User can add optional description (max 1000 chars)
- New tasks default to "pending" status
- Error shown if title is empty
- Error shown if title exceeds 200 characters
- Success confirmation shown after creation
- User redirected to task list after creation

### Implementation for User Story 1

- [ ] T019 [US1] Implement POST /api/{user_id}/tasks endpoint in backend/app/routers/tasks.py
- [ ] T020 [US1] Add request validation for TaskCreate schema with field constraints
- [ ] T021 [US1] Add JWT authentication dependency and user_id validation to POST endpoint
- [ ] T022 [US1] Add database insert logic with user_id from authenticated user
- [ ] T023 [US1] Return 201 Created with TaskRead response and Location header
- [ ] T024 [P] [US1] Create TaskForm component with React Hook Form in frontend/src/components/tasks/TaskForm.tsx
- [ ] T025 [P] [US1] Add form validation with zod schema and inline error display
- [ ] T026 [P] [US1] Create task creation page/modal in frontend/src/app/tasks/new/page.tsx or frontend/src/components/tasks/CreateTaskModal.tsx
- [ ] T027 [US1] Wire TaskForm to createTask API client function
- [ ] T028 [US1] Add success toast notification and redirect to task list on success
- [ ] T029 [US1] Add error toast notification for validation failures and API errors
- [ ] T030 [US1] Test create task flow end-to-end (form → API → database → redirect)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create tasks through the web interface

---

## Phase 4: User Story 2 - View All Tasks (Priority: P2)

**Goal**: Enable users to see all their tasks in one place with title, status, and creation date, providing visibility into their workload

**Independent Test**: Create several tasks with different statuses (pending/completed), navigate to the task list page, and verify all tasks display in a list/table format with relevant details visible, including responsive layout on mobile devices

**Acceptance Criteria**:
- All user's tasks display with title, status, and creation date
- Tasks are visually distinguished by status (pending vs completed)
- Layout adapts for mobile devices (320px+)
- Empty state message shown when no tasks exist
- Can view/expand task descriptions

### Implementation for User Story 2

- [ ] T031 [US2] Implement GET /api/{user_id}/tasks endpoint with status filter in backend/app/routers/tasks.py
- [ ] T032 [US2] Add query parameter validation for status (all|pending|completed)
- [ ] T033 [US2] Add JWT authentication dependency and user_id validation to GET endpoint
- [ ] T034 [US2] Add database query with user_id filter and created_at DESC ordering
- [ ] T035 [US2] Implement status filtering logic (pending, completed, all)
- [ ] T036 [US2] Return TaskListResponse with tasks array and total count
- [ ] T037 [P] [US2] Create TaskItem component for individual task display in frontend/src/components/tasks/TaskItem.tsx
- [ ] T038 [P] [US2] Create TaskList component for rendering task array in frontend/src/components/tasks/TaskList.tsx
- [ ] T039 [P] [US2] Add responsive grid/list layout with Tailwind CSS breakpoints
- [ ] T040 [P] [US2] Add empty state UI with "Create your first task" message
- [ ] T041 [US2] Create main dashboard page in frontend/src/app/dashboard/page.tsx
- [ ] T042 [US2] Add status filter tabs (All, Pending, Completed) to dashboard
- [ ] T043 [US2] Wire dashboard to getTasks API client with filter parameter
- [ ] T044 [US2] Add loading state indicator while fetching tasks
- [ ] T045 [US2] Add error handling for failed API requests
- [ ] T046 [US2] Test task list display with multiple tasks on desktop and mobile

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can create and view tasks

---

## Phase 5: User Story 3 - Toggle Task Completion Status (Priority: P3)

**Goal**: Enable users to mark tasks as complete or incomplete to track progress and accomplishments

**Independent Test**: Create a task, click the toggle checkbox to mark it complete (verify visual update), click again to mark it incomplete, refresh the page and verify the status persists

**Acceptance Criteria**:
- Pending tasks can be marked as completed
- Completed tasks can be marked as pending
- Status updates without page refresh (optimistic UI)
- Status change persists after page refresh
- UI updates within 500ms (SC-003)

### Implementation for User Story 3

- [ ] T047 [US3] Implement PATCH /api/{user_id}/tasks/{task_id}/complete endpoint in backend/app/routers/tasks.py
- [ ] T048 [US3] Add JWT authentication dependency and user_id validation to PATCH endpoint
- [ ] T049 [US3] Implement task retrieval with get_task_or_404() helper
- [ ] T050 [US3] Add toggle logic (completed = not completed) and updated_at timestamp update
- [ ] T051 [US3] Return updated TaskRead response with new completion status
- [ ] T052 [US3] Add checkbox input to TaskItem component for completion toggle
- [ ] T053 [US3] Implement optimistic UI update in task list state (immediate visual feedback)
- [ ] T054 [US3] Wire checkbox to toggleTaskCompletion API client function
- [ ] T055 [US3] Add rollback logic if API call fails (revert optimistic update)
- [ ] T056 [US3] Add visual distinction for completed tasks (strikethrough, gray text)
- [ ] T057 [US3] Add error toast if toggle fails
- [ ] T058 [US3] Test toggle functionality with network simulation (slow/failed requests)

**Checkpoint**: All core task operations now work - create, view, and track completion

---

## Phase 6: User Story 4 - Update Task Details (Priority: P4)

**Goal**: Enable users to edit task title and description to correct mistakes or add more information as needs change

**Independent Test**: Create a task, click the edit button, modify the title and/or description in the edit form, save changes, and verify the updates are reflected in the task list

**Acceptance Criteria**:
- Edit form pre-filled with current task values
- Can modify title and/or description
- Title required validation enforced
- Character limits enforced (200 for title, 1000 for description)
- Cancel button discards changes
- Success confirmation shown after update

### Implementation for User Story 4

- [ ] T059 [US4] Implement GET /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py
- [ ] T060 [US4] Add JWT authentication dependency and user_id validation to GET single task endpoint
- [ ] T061 [US4] Implement task retrieval with get_task_or_404() helper and return TaskRead
- [ ] T062 [US4] Implement PUT /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py
- [ ] T063 [US4] Add request validation for TaskUpdate schema with optional fields
- [ ] T064 [US4] Add JWT authentication dependency and user_id validation to PUT endpoint
- [ ] T065 [US4] Implement task update logic with field updates and updated_at timestamp
- [ ] T066 [US4] Return updated TaskRead response
- [ ] T067 [P] [US4] Create EditTaskForm component or modal in frontend/src/components/tasks/EditTaskForm.tsx
- [ ] T068 [P] [US4] Pre-fill form with existing task data using defaultValues
- [ ] T069 [US4] Add Edit button to TaskItem component
- [ ] T070 [US4] Wire EditTaskForm to updateTask API client function
- [ ] T071 [US4] Add cancel button that discards changes and closes form
- [ ] T072 [US4] Add success toast notification and refresh task list on update
- [ ] T073 [US4] Add error toast notification for validation failures
- [ ] T074 [US4] Test edit flow with various updates (title only, description only, both)

**Checkpoint**: Full CRUD operations now available except delete

---

## Phase 7: User Story 5 - Delete Task (Priority: P5)

**Goal**: Enable users to permanently remove tasks they no longer need to keep their task list clean and focused

**Independent Test**: Create a task, click the delete button, confirm the deletion in the dialog, and verify the task is removed from the list without page refresh

**Acceptance Criteria**:
- Confirmation dialog appears before deletion
- Task permanently removed after confirmation
- Task remains if user cancels
- Success message shown after deletion
- List updates without page refresh
- Delete completes within 1 second (SC-008)

### Implementation for User Story 5

- [ ] T075 [US5] Implement DELETE /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py
- [ ] T076 [US5] Add JWT authentication dependency and user_id validation to DELETE endpoint
- [ ] T077 [US5] Implement task retrieval with get_task_or_404() helper
- [ ] T078 [US5] Add database delete operation and commit
- [ ] T079 [US5] Return 204 No Content on successful deletion
- [ ] T080 [US5] Add Delete button to TaskItem component
- [ ] T081 [US5] Implement browser confirmation dialog using window.confirm()
- [ ] T082 [US5] Wire delete button to deleteTask API client function
- [ ] T083 [US5] Update task list state to remove deleted task (optimistic UI)
- [ ] T084 [US5] Add success toast notification "Task deleted successfully"
- [ ] T085 [US5] Add error toast notification if deletion fails
- [ ] T086 [US5] Test delete flow with confirmation and cancellation paths

**Checkpoint**: All user stories (1-5) should now be independently functional - complete CRUD operations available

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [ ] T087 [P] Add responsive design testing on mobile (320px), tablet (768px), desktop (1920px)
- [ ] T088 [P] Add loading states to all API operations (create, update, delete)
- [ ] T089 [P] Verify all validation errors display within 200ms (SC-007)
- [ ] T090 [P] Verify task list loads within 2 seconds on standard connection (SC-002)
- [ ] T091 [P] Verify toggle completion updates within 500ms (SC-003)
- [ ] T092 [P] Test with 500 tasks per user to verify no performance degradation (SC-006)
- [ ] T093 [P] Add accessibility testing (keyboard navigation, ARIA labels, screen reader support)
- [ ] T094 [P] Verify CORS configuration allows frontend domain
- [ ] T095 [P] Test JWT token expiration handling and refresh
- [ ] T096 [P] Add API endpoint documentation in FastAPI Swagger UI (/docs)
- [ ] T097 [P] Update backend/CLAUDE.md with task-specific patterns and conventions
- [ ] T098 [P] Update frontend/CLAUDE.md with task component patterns
- [ ] T099 [P] Run quickstart.md validation to ensure guide is accurate
- [ ] T100 [P] Add error logging for backend exceptions
- [ ] T101 Security audit: verify all queries filter by authenticated user_id
- [ ] T102 Security audit: verify user_id in URL matches JWT subject claim
- [ ] T103 Code review: ensure no hardcoded secrets in codebase
- [ ] T104 Create demo data script for testing with sample tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion AND authentication feature (002-user-authentication) - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 → US2 → US3 → US4 → US5
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires tasks to exist (from US1/US2) for testing
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires tasks to exist (from US1/US2) for testing
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Requires tasks to exist (from US1/US2) for testing

### Within Each User Story

- Backend endpoints before frontend components (API must exist)
- API client functions before UI components (client functions needed by components)
- Core components before integration (TaskForm/TaskItem before dashboard)
- User Story 1 should be complete before heavy testing of US3-US5 (need tasks to exist)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Backend and Frontend sections)
- Backend and Frontend foundational work can proceed in parallel
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel
- User Stories 3, 4, and 5 can start in parallel after US1 creates at least one task
- Different user stories can be worked on in parallel by different team members
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# These backend tasks can run in parallel (different responsibilities):
Task T019: "Implement POST endpoint"
Task T020: "Add request validation"
# (Then T021-T023 follow sequentially)

# These frontend tasks can run in parallel (different files):
Task T024: "Create TaskForm component in frontend/src/components/tasks/TaskForm.tsx"
Task T025: "Add form validation with zod schema"
Task T026: "Create task creation page in frontend/src/app/tasks/new/page.tsx"
```

---

## Parallel Example: User Story 2

```bash
# These frontend tasks can run in parallel (different files):
Task T037: "Create TaskItem component in frontend/src/components/tasks/TaskItem.tsx"
Task T038: "Create TaskList component in frontend/src/components/tasks/TaskList.tsx"
Task T039: "Add responsive layout with Tailwind"
Task T040: "Add empty state UI"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - requires authentication feature complete first)
3. Complete Phase 3: User Story 1 (Create Task)
4. Complete Phase 4: User Story 2 (View Tasks)
5. **STOP and VALIDATE**: Test creating and viewing tasks independently
6. Deploy/demo if ready (basic task management working)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (can create tasks!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP complete - create + view!)
4. Add User Story 3 → Test independently → Deploy/Demo (can mark complete)
5. Add User Story 4 → Test independently → Deploy/Demo (can edit tasks)
6. Add User Story 5 → Test independently → Deploy/Demo (full CRUD complete!)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Create)
   - Developer B: User Story 2 (View)
3. After US1/US2 complete:
   - Developer A: User Story 3 (Toggle)
   - Developer B: User Story 4 (Update)
   - Developer C: User Story 5 (Delete)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 104
- Setup: 6 tasks
- Foundational: 12 tasks (8 backend, 4 frontend)
- User Story 1 (Create): 12 tasks
- User Story 2 (View): 16 tasks
- User Story 3 (Toggle): 12 tasks
- User Story 4 (Update): 16 tasks
- User Story 5 (Delete): 12 tasks
- Polish: 18 tasks

**Parallel Opportunities**: 42 tasks marked [P]

**Independent Test Criteria**:
- US1: Can create tasks with title and description
- US2: Can view all tasks with status filtering
- US3: Can toggle task completion status
- US4: Can edit task title and description
- US5: Can delete tasks with confirmation

**Suggested MVP Scope**: User Stories 1 + 2 (Create + View tasks)

**Format Validation**: ✅ All tasks follow checklist format with checkboxes, IDs, optional [P] and [Story] labels, and file paths

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Authentication feature (002-user-authentication) MUST be implemented before starting Foundational phase
- User model, JWT middleware, and Better Auth configuration are prerequisites
- Verify user_id filtering on all database queries for security
- Test optimistic UI updates for toggle and delete operations
- Follow responsive design principles (mobile-first with Tailwind breakpoints)
