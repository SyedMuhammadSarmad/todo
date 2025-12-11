# Frontend Guidelines - Next.js 16+ (App Router)

**Framework**: Next.js 16+ with App Router
**Language**: TypeScript
**Styling**: Tailwind CSS
**Authentication**: Better Auth with JWT

## Stack Overview

| Technology | Purpose |
|------------|---------|
| Next.js 16+ | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS | Utility-first styling |
| Better Auth | Authentication library |
| React 19 | UI library |

## Project Structure (To Be Created)

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home/landing page
│   ├── login/
│   │   └── page.tsx        # Login page
│   ├── signup/
│   │   └── page.tsx        # Signup page
│   └── tasks/
│       └── page.tsx        # Main task dashboard (protected)
│
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── TaskList.tsx        # Task list container
│   ├── TaskItem.tsx        # Individual task item
│   ├── TaskForm.tsx        # Create/edit task form
│   └── Header.tsx          # App header with nav
│
├── lib/                    # Utilities and configurations
│   ├── api.ts              # API client with JWT handling
│   ├── auth.ts             # Better Auth configuration
│   └── utils.ts            # Helper functions
│
├── public/                 # Static assets
│   └── images/
│
├── .env.local              # Environment variables (git-ignored)
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── CLAUDE.md               # This file
```

## Development Patterns

### 1. Component Architecture

**Use Server Components by Default**
```tsx
// app/tasks/page.tsx
// Server Component - fetches data on server
export default async function TasksPage() {
  // This runs on the server
  const tasks = await api.getTasks();

  return <TaskList initialTasks={tasks} />;
}
```

**Use Client Components Only When Needed**
```tsx
// components/TaskItem.tsx
'use client'; // Only when you need interactivity

import { useState } from 'react';

export function TaskItem({ task, onComplete, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  // Client-side state and event handlers
}
```

### 2. API Client Pattern

All backend calls **MUST** go through the centralized API client:

```typescript
// lib/api.ts
import { getSession } from './auth';

class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  private async getHeaders() {
    const session = await getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.token ? `Bearer ${session.token}` : '',
    };
  }

  async getTasks(userId: string) {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseURL}/api/${userId}/tasks`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    return response.json();
  }

  async createTask(userId: string, data: { title: string; description?: string }) {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseURL}/api/${userId}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    return response.json();
  }
}

export const api = new APIClient();
```

**Usage in Components**:
```tsx
import { api } from '@/lib/api';

// In Server Component
const tasks = await api.getTasks(userId);

// In Client Component
const handleCreate = async (data) => {
  const newTask = await api.createTask(userId, data);
};
```

### 3. Better Auth Configuration

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth/client';

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    // JWT plugin for token-based auth
  ],
});

export async function getSession() {
  return await auth.getSession();
}

export async function signIn(email: string, password: string) {
  return await auth.signIn.email({ email, password });
}

export async function signUp(email: string, password: string, name: string) {
  return await auth.signUp.email({ email, password, name });
}

export async function signOut() {
  return await auth.signOut();
}
```

### 4. Styling with Tailwind CSS

**Conventions**:
- Use Tailwind utility classes (no inline styles)
- Follow mobile-first responsive design
- Use consistent spacing scale (p-4, m-2, gap-4)
- Define custom colors in `tailwind.config.js`

```tsx
// Good: Tailwind utilities
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
  <TaskList />
</div>

// Bad: Inline styles
<div style={{ display: 'flex', padding: '24px' }}>
  <h2 style={{ fontSize: '24px' }}>Tasks</h2>
</div>
```

**Responsive Design**:
```tsx
<div className="
  grid
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns
  lg:grid-cols-3       // Desktop: 3 columns
  gap-4
">
  {tasks.map(task => <TaskItem key={task.id} task={task} />)}
</div>
```

### 5. Form Handling

Use React Hook Form for complex forms (to be added as dependency):

```tsx
'use client';

import { useForm } from 'react-hook-form';

export function TaskForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          {...register('title', { required: 'Title is required', maxLength: 200 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description', { maxLength: 1000 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Create Task
      </button>
    </form>
  );
}
```

### 6. Error Handling

```tsx
'use client';

import { useState } from 'react';

export function TaskList() {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await api.deleteTask(userId, id);
      // Refresh or update state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {/* Task list content */}
    </>
  );
}
```

### 7. Loading States

```tsx
import { Suspense } from 'react';

// Server Component with Suspense
export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TaskListAsync />
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

## Environment Variables

Create `.env.local` (DO NOT commit to git):

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=your-shared-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

## File Naming Conventions

- **Pages**: `page.tsx` (App Router convention)
- **Layouts**: `layout.tsx`
- **Components**: PascalCase (e.g., `TaskList.tsx`, `TaskItem.tsx`)
- **Utilities**: camelCase (e.g., `api.ts`, `utils.ts`)
- **Types**: `types.ts` or inline with components

## Type Definitions

```typescript
// types.ts or inline
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
```

## Common Pitfalls to Avoid

❌ **Don't**: Mix server and client component logic
❌ **Don't**: Use inline styles (use Tailwind)
❌ **Don't**: Make API calls directly (use `api` client)
❌ **Don't**: Store JWT tokens in localStorage (use Better Auth)
❌ **Don't**: Forget to handle loading/error states

✅ **Do**: Use Server Components by default
✅ **Do**: Use Tailwind CSS utilities
✅ **Do**: Centralize API calls in `lib/api.ts`
✅ **Do**: Let Better Auth handle token management
✅ **Do**: Provide loading and error feedback

## Development Commands

```bash
# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# Opens on http://localhost:3000

# Build for production
npm run build

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

## Testing (To Be Added)

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Component Tests**: Storybook (optional)

## References

- Next.js Docs: https://nextjs.org/docs
- Better Auth: https://better-auth.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

---

**Before implementing**, always check:
1. ✅ Read relevant spec from `specs/phase-2/ui/` or `specs/phase-2/features/`
2. ✅ Follow patterns in this CLAUDE.md
3. ✅ Use Server Components unless interactivity is needed
4. ✅ All API calls go through `lib/api.ts`
5. ✅ Use Tailwind CSS for all styling
