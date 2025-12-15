"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { SignoutButton } from "@/components/auth/SignoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getTasks } from "@/lib/api/tasks";
import { useSession } from "@/lib/auth-client";
import type { Task, TaskStatus } from "@/types/task";
import { toast } from "react-hot-toast";

/**
 * Tasks page - Main task management interface
 * Integrates TaskForm and TaskList components
 */
export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [showForm, setShowForm] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);

    try {
      const response = await getTasks(statusFilter);
      setTasks(response.tasks);
    } catch (error: any) {
      toast.error(error.message || "Failed to load tasks");
      console.error("Load tasks error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks on mount and when filter changes
  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const handleTaskCreated = () => {
    // Reload tasks after creating a new one
    loadTasks();
    // Hide form
    setShowForm(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors duration-200">
        {/* Modern Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
          <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 dark:shadow-none shadow-md">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Tasks</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                 {session?.user?.email && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{session.user.email}</span>
                )}
                <ThemeToggle />
                <SignoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
              Welcome back, {session?.user?.name || "Guest"}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              You have {tasks.filter(t => !t.completed).length} pending tasks.
            </p>
          </div>

          {/* Create task section */}
          <div className="mb-8 transition-all duration-300 ease-in-out">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="group w-full py-4 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-dashed rounded-xl text-gray-500 dark:text-gray-400 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                <span className="font-medium">Create New Task</span>
              </button>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Task</h2>
                    <button 
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <TaskForm
                  onSuccess={handleTaskCreated}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Tasks</h3>
            <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-xl flex gap-1 transition-colors">
              {(["all", "pending", "completed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    statusFilter === status
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
                <p className="text-sm font-medium">Loading your tasks...</p>
              </div>
            ) : (
              <TaskList tasks={tasks} onTaskUpdated={loadTasks} />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
