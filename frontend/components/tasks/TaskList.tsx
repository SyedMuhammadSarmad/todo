"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { toggleTaskCompletion, deleteTask } from "@/lib/api/tasks";
import type { Task } from "@/types/task";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdated?: () => void;
}

/**
 * TaskList component for displaying and managing tasks
 * User Story 2: View All Tasks (T031-T046)
 */
export function TaskList({ tasks, onTaskUpdated }: TaskListProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);

  const handleToggleComplete = async (taskId: number) => {
    setLoadingTaskId(taskId);

    try {
      await toggleTaskCompletion(taskId);
      // toast.success("Task updated!"); // Optional: reduced noise for quick toggles

      // Refresh task list
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
      console.error("Toggle completion error:", error);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleDelete = async (taskId: number, title: string) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setLoadingTaskId(taskId);

    try {
      await deleteTask(taskId);
      toast.success("Task deleted!");

      // Refresh task list
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      console.error("Delete error:", error);
    } finally {
      setLoadingTaskId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-medium text-lg">No tasks found</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
          Get started by creating a new task above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`group relative bg-white dark:bg-gray-800 border rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:border-indigo-100 dark:hover:border-gray-600 ${
            task.completed 
              ? "bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800" 
              : "border-gray-200 dark:border-gray-700"
          } ${loadingTaskId === task.id ? "opacity-60 pointer-events-none" : ""}`}
        >
          <div className="flex items-start gap-4">
            {/* Custom Checkbox */}
            <div className="pt-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id)}
                  className="h-5 w-5 rounded-md border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer transition-colors bg-white dark:bg-gray-800"
                  aria-label={`Mark "${task.title}" as ${task.completed ? "pending" : "completed"}`}
                />
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                  <h3
                    className={`text-base font-semibold leading-6 transition-colors ${
                      task.completed ? "text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </h3>
                  
                   {/* Delete button (visible on hover or focus) */}
                    <button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg -mt-1 -mr-1"
                      aria-label={`Delete task "${task.title}"`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.49 1.478l-.565 9.064a3 3 0 01-2.991 2.96H7.665a3 3 0 01-2.991-2.96l-.565-9.064a.75.75 0 01-.49-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
              </div>

              {task.description && (
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    task.completed ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                    </svg>
                    {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {task.updated_at !== task.created_at && (
                  <span className="text-gray-300 dark:text-gray-600">• Updated</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
