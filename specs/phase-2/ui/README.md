# UI Specifications

User interface component and page specifications for Next.js frontend.

## Purpose

UI specs define:
- Component structure and props
- Page layouts and routing
- User interactions and states
- Styling approach (Tailwind CSS)
- Responsive design breakpoints

## Files to Create

- **components.md**: Reusable UI components
  - TaskList component
  - TaskItem component
  - TaskForm component (create/edit)
  - AuthForm component (login/signup)

- **pages.md**: Page specifications
  - `/` - Home/Landing page
  - `/login` - Authentication page
  - `/signup` - User registration
  - `/tasks` - Task dashboard (main app)

## Component Specification Format

Each component should document:

1. **Purpose**: What the component does
2. **Props**: TypeScript interface
3. **State**: Local state management
4. **Events**: User interactions
5. **Styling**: Tailwind classes
6. **Example Usage**: Code snippet

## Example

```markdown
### Component: TaskItem

A single task item in the task list with complete/delete actions.

**Props**:
```typescript
interface TaskItemProps {
  task: {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
    created_at: string;
  };
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}
```

**Features**:
- Display task title and description
- Show completion status with checkbox
- Edit button (opens edit form)
- Delete button with confirmation
- Responsive design (mobile-first)

**Styling**:
- Tailwind CSS utilities
- Completed tasks: line-through text, gray color
- Hover effects on buttons
- Mobile: stacked layout
- Desktop: inline actions

**Example Usage**:
```tsx
<TaskItem
  task={{
    id: 1,
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    completed: false,
    created_at: "2025-12-11T10:00:00Z"
  }}
  onComplete={handleComplete}
  onDelete={handleDelete}
  onEdit={handleEdit}
/>
```
```

## Page Specification Format

Each page should document:

1. **Route**: URL path
2. **Layout**: Page structure
3. **Components**: Which components are used
4. **Data Fetching**: API calls
5. **Authentication**: Protected/public
6. **SEO**: Metadata

## Example

```markdown
### Page: /tasks

Main task dashboard - displays user's tasks with CRUD operations.

**Route**: `/tasks`
**Authentication**: Protected (requires login)
**Layout**: DashboardLayout with header and navigation

**Components Used**:
- TaskList (container)
- TaskItem (for each task)
- TaskForm (create/edit modal)
- Header (with logout button)

**Data Fetching**:
```typescript
// Server Component (App Router)
async function TasksPage() {
  const tasks = await api.getTasks(); // Fetch on server
  return <TaskList initialTasks={tasks} />;
}
```

**Features**:
- Display all user tasks
- Filter by status (all/pending/completed)
- Sort by date/title
- Create new task (modal/form)
- Edit existing task (inline or modal)
- Delete task (with confirmation)
- Mark complete/incomplete (toggle)

**Responsive Design**:
- Mobile: Single column, stacked cards
- Tablet: 2-column grid
- Desktop: Table view with inline actions
```

---

**Status**: 📝 To be created via `/sp.specify`
**Related**: See `../features/` for user flows, `../api/` for data models
