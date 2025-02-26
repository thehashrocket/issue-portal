"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IssueStatus, IssuePriority, User, Client } from "@prisma/client";
// z is imported but not used directly in this file
// import { z } from "zod";
import Link from "next/link";

// Import the issue schema from validation.ts
import { issueCreateSchema, type IssueCreateInput } from "@/lib/validation";

// Constants
const STATUS_OPTIONS = Object.values(IssueStatus);
const PRIORITY_OPTIONS = Object.values(IssuePriority);


export default function NewIssuePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IssueCreateInput>({
    resolver: zodResolver(issueCreateSchema),
  });
  
  useEffect(() => {
    // Fetch users and clients when component mounts
    const fetchData = async () => {
      try {
        const [usersResponse, clientsResponse] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/clients")
        ]);

        if (!usersResponse.ok || !clientsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const usersData = await usersResponse.json();
        const clientsData = await clientsResponse.json();

        setUsers(usersData.data);
        setClients(clientsData.data);
      } catch (err) {
        setError("Failed to load form data");
        console.error("Error fetching form data:", err);
      }
    };

    fetchData();
  }, []);
  
  const onSubmit = async (data: IssueCreateInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create issue");
      }
      
      router.push("/issues");
    } catch (err) {
      setError("Failed to create issue");
      console.error("Error creating issue:", err);
    } finally {
      setIsLoading(false);
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
          {/* Client */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              id="clientId"
              {...register("clientId")}
              className={`w-full border ${
                errors.clientId ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              id="assignedToId"
              {...register("assignedToId")}
              className={`w-full border ${
                errors.assignedToId ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
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
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white ${
                isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 