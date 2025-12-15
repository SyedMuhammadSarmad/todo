/**
 * Task API client
 * All requests automatically include Better Auth JWT cookie
 */
import type { Task, TaskCreate, TaskUpdate, TaskListResponse, TaskStatus } from "@/types/task";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Session expired - redirect to signin
      if (typeof window !== "undefined") {
        window.location.href = "/signin?expired=true";
      }
      throw new Error("Session expired - please sign in");
    }

    if (response.status === 403) {
      throw new Error("Access denied - you don't have permission for this action");
    }

    if (response.status === 404) {
      throw new Error("Task not found");
    }

    // Try to get error message from response
    try {
      const error = await response.json();
      throw new Error(error.detail || "An error occurred");
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  // Handle 204 No Content (delete response)
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Get all tasks for the authenticated user
 * @param status Optional filter: 'all', 'pending', or 'completed'
 */
export async function getTasks(status: TaskStatus = "all"): Promise<TaskListResponse> {
  const url = new URL(`${API_URL}/api/tasks/`);

  // Add status filter if not 'all'
  if (status !== "all") {
    url.searchParams.append("status", status);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include", // Include Better Auth cookie
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse<TaskListResponse>(response);
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: number): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse<Task>(response);
}

/**
 * Create a new task
 */
export async function createTask(data: TaskCreate): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<Task>(response);
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: number, data: TaskUpdate): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<Task>(response);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse<void>(response);
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(taskId: number): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse<Task>(response);
}
