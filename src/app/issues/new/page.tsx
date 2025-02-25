"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

// Import the issue schema from validation.ts
import { issueCreateSchema, type IssueCreateInput } from "@/lib/validation";

// Constants
const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// User type
type User = {
  id: string;
  name: string | null;
  email: string;
};

export default function NewIssuePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Fetch users for the assignee dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch users");
        }
        
        setUsers(data.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IssueCreateInput>({
    resolver: zodResolver(issueCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      assignedToId: null,
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: IssueCreateInput) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to create issue");
      }
      
      // Redirect to the issues list page
      router.push("/issues");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/issues" className="text-blue-600 hover:underline">
          &larr; Back to Issues
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Create New Issue</h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              className={`w-full border ${
                errors.title ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
              placeholder="Enter issue title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className={`w-full border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
              placeholder="Enter issue description"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              {...register("status")}
              className={`w-full border ${
                errors.status ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
          
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              {...register("priority")}
              className={`w-full border ${
                errors.priority ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>
          
          {/* Assigned To */}
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedToId"
              {...register("assignedToId")}
              className={`w-full border ${
                errors.assignedToId ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
              disabled={loadingUsers}
            >
              <option value="">Unassigned</option>
              {loadingUsers ? (
                <option disabled>Loading users...</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))
              )}
            </select>
            {errors.assignedToId && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedToId.message}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded text-white ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 