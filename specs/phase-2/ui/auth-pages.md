# Authentication Pages & Components

**Phase**: Phase 2
**Feature**: User Authentication (002-user-authentication)
**Created**: 2025-12-14

## Overview

UI specifications for authentication pages and components using Next.js 16+ App Router and Tailwind CSS.

## Pages

### /signup - User Registration

**Route**: `/signup`
**Authentication**: Public (redirects to /tasks if already authenticated)
**Layout**: CenteredAuthLayout

**Components Used**:
- SignupForm (main form component)
- AuthPageHeader (logo + title)
- AuthFooter (links to signin)

**Features**:
- Email input with validation
- Password input with strength indicator
- Submit button with loading state
- Error message display
- Link to signin page
- Auto-redirect to /tasks on success

**Responsive Design**:
- Mobile: Full-width card, stacked inputs
- Desktop: Centered card (max-width 400px)

**Example Structure**:
```tsx
// app/signup/page.tsx
export default function SignupPage() {
  return (
    <CenteredAuthLayout>
      <AuthPageHeader title="Create Account" />
      <SignupForm />
      <AuthFooter>
        Already have an account? <Link href="/signin">Sign in</Link>
      </AuthFooter>
    </CenteredAuthLayout>
  );
}
```

### /signin - User Login

**Route**: `/signin`
**Authentication**: Public (redirects to /tasks if already authenticated)
**Layout**: CenteredAuthLayout

**Components Used**:
- SigninForm (main form component)
- AuthPageHeader (logo + title)
- AuthFooter (links to signup)

**Features**:
- Email input
- Password input with show/hide toggle
- "Remember me" checkbox (optional)
- Submit button with loading state
- Error message display
- Link to signup page
- Auto-redirect to /tasks on success

**Responsive Design**:
- Mobile: Full-width card, stacked inputs
- Desktop: Centered card (max-width 400px)

**Example Structure**:
```tsx
// app/signin/page.tsx
export default function SigninPage() {
  return (
    <CenteredAuthLayout>
      <AuthPageHeader title="Sign In" />
      <SigninForm />
      <AuthFooter>
        Don't have an account? <Link href="/signup">Sign up</Link>
      </AuthFooter>
    </CenteredAuthLayout>
  );
}
```

### /tasks - Protected Dashboard

**Route**: `/tasks`
**Authentication**: Protected (requires valid JWT token)
**Layout**: DashboardLayout (with header + navigation)

**Authentication Check**:
```tsx
// app/tasks/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect('/signin');

  return <TaskDashboard />;
}
```

**Header Features**:
- User email display
- Signout button
- Navigation links (future: settings, profile)

## Components

### SignupForm

**Purpose**: Form for creating new user account

**Props**:
```typescript
interface SignupFormProps {
  onSuccess?: () => void;  // Optional callback after successful signup
}
```

**State**:
```typescript
{
  email: string;
  password: string;
  errors: { email?: string; password?: string };
  isLoading: boolean;
}
```

**Validation**:
- Email: Real-time email format validation
- Password: Real-time strength checking (8+ chars, 1 letter, 1 number)
- Submit: Disabled until both fields are valid

**Error Handling**:
- Display API errors in toast notification
- Show field-specific errors inline
- Clear errors on input change

**Example Usage**:
```tsx
<SignupForm onSuccess={() => router.push('/tasks')} />
```

### SigninForm

**Purpose**: Form for authenticating existing user

**Props**:
```typescript
interface SigninFormProps {
  onSuccess?: () => void;  // Optional callback after successful signin
}
```

**State**:
```typescript
{
  email: string;
  password: string;
  error: string | null;  // Generic error for failed signin
  isLoading: boolean;
}
```

**Features**:
- Show/hide password toggle
- Remember me checkbox (stores preference in localStorage)
- Rate limit feedback (display countdown after 5 failed attempts)

**Error Handling**:
- Display generic "Invalid email or password" message
- Show rate limit message if applicable
- Toast notification for network errors

**Example Usage**:
```tsx
<SigninForm onSuccess={() => router.push('/tasks')} />
```

### AuthPageHeader

**Purpose**: Consistent header for auth pages (logo + title)

**Props**:
```typescript
interface AuthPageHeaderProps {
  title: string;
  subtitle?: string;
}
```

**Styling**:
```tsx
<div className="text-center mb-8">
  <Logo className="mx-auto mb-4" />
  <h1 className="text-2xl font-bold">{title}</h1>
  {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
</div>
```

### ProtectedRoute

**Purpose**: HOC/wrapper to protect routes requiring authentication

**Implementation**:
```tsx
// components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/signin');
    }
  }, [session, isLoading, router]);

  if (isLoading) return <LoadingSpinner />;
  if (!session) return null;

  return <>{children}</>;
}
```

**Usage**:
```tsx
<ProtectedRoute>
  <TaskDashboard />
</ProtectedRoute>
```

### UserMenu

**Purpose**: Dropdown menu in header showing user info and signout button

**Props**:
```typescript
interface UserMenuProps {
  user: {
    email: string;
  };
  onSignout: () => void;
}
```

**Features**:
- Display user email
- Signout button
- Dropdown menu (desktop)
- Slide-out menu (mobile)

**Styling (Tailwind)**:
```tsx
<Menu>
  <MenuButton className="flex items-center space-x-2">
    <UserIcon />
    <span>{user.email}</span>
  </MenuButton>
  <MenuItems className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md">
    <MenuItem>
      <button onClick={onSignout}>Sign Out</button>
    </MenuItem>
  </MenuItems>
</Menu>
```

## Layouts

### CenteredAuthLayout

**Purpose**: Layout for signup/signin pages (centered card design)

```tsx
export function CenteredAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {children}
      </div>
    </div>
  );
}
```

### DashboardLayout

**Purpose**: Layout for authenticated pages (header + content area)

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <UserMenu />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

## Styling Guidelines

### Tailwind Classes

**Form Inputs**:
```
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
```

**Primary Button**:
```
className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
```

**Error Message**:
```
className="text-red-600 text-sm mt-1"
```

**Link**:
```
className="text-blue-600 hover:underline"
```

### Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

## User Experience Flow

### Signup Flow

```
1. User lands on /signup
2. Enters email and password
3. Real-time validation shows feedback
4. Clicks "Create Account" button
5. Loading spinner appears
6. On success: Toast "Account created!" + redirect to /tasks
7. On error: Toast with error message, form stays visible
```

### Signin Flow

```
1. User lands on /signin
2. Enters email and password
3. Clicks "Sign In" button
4. Loading spinner appears
5. On success: Redirect to /tasks (no toast needed)
6. On error: Display "Invalid email or password" inline
7. On rate limit: Display "Too many attempts. Try again in X seconds"
```

### Signout Flow

```
1. User clicks "Sign Out" in UserMenu
2. Confirmation dialog (optional): "Are you sure?"
3. API call to /api/auth/signout
4. Clear token from storage
5. Toast "Signed out successfully"
6. Redirect to /signin
```

## Accessibility

- **Form Labels**: All inputs have associated labels
- **Error Announcements**: Use aria-live for error messages
- **Keyboard Navigation**: All interactive elements keyboard-accessible
- **Focus Management**: Clear focus indicators
- **Screen Reader**: Proper ARIA labels and roles

## Security Considerations

- **Password Visibility**: Default hidden, show/hide toggle optional
- **Auto-complete**: Allow browser password managers
- **HTTPS**: All forms submit over HTTPS in production
- **No Caching**: Set cache headers on auth pages to prevent back-button exposure

## Related Documentation

- **API Contracts**: `specs/phase-2/api/auth-endpoints.md`
- **Component Details**: `specs/phase-2/002-user-authentication/contracts/auth-api.md`
- **Research & Decisions**: `specs/phase-2/002-user-authentication/research.md`
