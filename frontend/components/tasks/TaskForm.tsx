"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { taskCreateSchema, type TaskCreateFormData } from "@/lib/validations/task";
import { createTask } from "@/lib/api/tasks";
import type { Task } from "@/types/task";

interface TaskFormProps {
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
}

/**
 * TaskForm component for creating new tasks
 * User Story 1: Create New Task (T019-T030)
 */
export function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskCreateFormData>({
    resolver: zodResolver(taskCreateSchema),
  });

  const onSubmit = async (data: TaskCreateFormData) => {
    setIsLoading(true);

    try {
      // Create task via API
      const newTask = await createTask(data);

      // Show success message
      toast.success("Task created successfully!");

      // Reset form
      reset();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(newTask);
      }
    } catch (error: any) {
      // Show error message
      const errorMessage = error.message || "Failed to create task";
      toast.error(errorMessage);

      console.error("Task creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 w-full"
      aria-label="Create task form"
      noValidate
    >
      {/* Title field */}
      <div>
        <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          placeholder="What needs to be done?"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={errors.title ? "true" : "false"}
          aria-describedby={errors.title ? "title-error" : undefined}
          maxLength={200}
        />
        {errors.title && (
          <p id="title-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 disabled:opacity-50 resize-none"
          placeholder="Add details about this task..."
          disabled={isLoading}
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? "description-error" : undefined}
          rows={3}
          maxLength={1000}
        />
        {errors.description && (
          <p id="description-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 px-4 rounded-xl font-medium shadow-sm shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
          aria-label={isLoading ? "Creating task" : "Create task"}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            "Create Task"
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Cancel task creation"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
