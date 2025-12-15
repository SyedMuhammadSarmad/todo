/**
 * Task type definitions
 * Matches backend Task model structure
 */

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
}

export interface TaskCreate {
  title: string;
  description?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export type TaskStatus = "all" | "pending" | "completed";
