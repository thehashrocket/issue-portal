"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IssueStatus, IssuePriority, User, Client } from "@prisma/client";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// Import the issue schema from validation.ts
import { issueCreateSchema, type IssueCreateInput } from "@/lib/validation";

// Constants
const ENVIRONMENT_OPTIONS = [
  "PRODUCTION",
  "STAGING",
  "DEVELOPMENT",
  "TEST",
  "LOCAL"
] as const;
const HOW_DISCOVERED_OPTIONS = [
  "AUTOMATED_TESTING",
  "CLIENT_REFERRED",
  "MANUAL_TESTING",
  "MONITORING_TOOL",
  "OTHER",
  "QA_TEAM",
  "REFERRAL",
  "SELF_DISCOVERED",
  "SOCIAL_MEDIA",
  "WEB_SEARCH"
] as const;
const PRIORITY_OPTIONS = Object.values(IssuePriority);
const STATUS_OPTIONS = Object.values(IssueStatus);


export default function NewIssuePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWorkAroundDescription, setShowWorkAroundDescription] = useState(false);
  const [showRootCauseDescription, setShowRootCauseDescription] = useState(false);

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
      // Ensure these fields are strings, not booleans
      const formData = {
        ...data,
        rootCauseIdentified: data.rootCauseIdentified?.toString() as 'true' | 'false' | 'stillInvestigating',
        workAroundAvailable: data.workAroundAvailable?.toString() as 'true' | 'false'
      };

      console.log('Submitting data:', formData);

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Log the raw response
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to create issue';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      router.push("/issues");
    } catch (err) {
      console.error("Error creating issue:", err);
      setError(err instanceof Error ? err.message : "Failed to create issue");
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

      <div className="bg-white p-6 rounded-sm shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Create New Issue</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-sm mb-6">
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
              className={`w-full border ${errors.clientId ? "border-red-500" : "border-gray-300"
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
              className={`w-full border ${errors.assignedToId ? "border-red-500" : "border-gray-300"
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
              className={`w-full border ${errors.title ? "border-red-500" : "border-gray-300"
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
              className={`w-full border ${errors.description ? "border-red-500" : "border-gray-300"
                } rounded px-3 py-2`}
              placeholder="Enter issue description"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="showAdvanced">
              <AccordionTrigger className="text-sm font-medium text-gray-700 underline mb-1">Show Advanced</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* How Discovered */}
                  <div>
                    <label htmlFor="howDisovered" className="block text-sm font-medium text-gray-700 mb-1">
                      How Discovered
                    </label>
                    <select
                      id="howDisovered"
                      {...register("howDisovered")}
                      className={`w-full border ${errors.howDisovered ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    >
                      {HOW_DISCOVERED_OPTIONS.map((howDisovered) => (
                        <option key={howDisovered} value={howDisovered}>
                          {howDisovered}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Impact */}
                  <div>
                    <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
                      Impact
                    </label>
                    <textarea
                      id="impact"
                      {...register("impact")}
                      rows={4}
                      className={`w-full border ${errors.impact ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    ></textarea>
                  </div>

                  {/* Steps to Reproduce */}
                  <div>
                    <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-1">
                      Steps to Reproduce
                    </label>
                    <textarea
                      id="stepsToReproduce"
                      {...register("stepsToReproduce")}
                      rows={4}
                      className={`w-full border ${errors.stepsToReproduce ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    ></textarea>
                  </div>

                  {/* Expected Result */}
                  <div>
                    <label htmlFor="expectedResult" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Result
                    </label>
                    <textarea
                      id="expectedResult"
                      {...register("expectedResult")}
                      rows={4}
                      className={`w-full border ${errors.expectedResult ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    ></textarea>
                  </div>

                  {/* Actual Result */}
                  <div>
                    <label htmlFor="actualResult" className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Result
                    </label>
                    <textarea
                      id="actualResult"
                      {...register("actualResult")}
                      rows={4}
                      className={`w-full border ${errors.actualResult ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    ></textarea>
                  </div>

                  {/* Environment */}
                  <div>
                    <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
                      Environment
                    </label>
                    <select
                      id="environment"
                      {...register("environment")}
                      className={`w-full border ${errors.environment ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    >
                      {ENVIRONMENT_OPTIONS.map((environment) => (
                        <option key={environment} value={environment}>
                          {environment}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Logs */}
                  <div>
                    <label htmlFor="relatedLogs" className="block text-sm font-medium text-gray-700 mb-1">
                      Related Logs / Evidence
                    </label>
                    <textarea
                      id="relatedLogs"
                      {...register("relatedLogs")}
                      rows={4}
                      className={`w-full border ${errors.relatedLogs ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    ></textarea>
                  </div>

                  {/* Work Around Available */}
                  <div>
                    <label htmlFor="workAroundAvailable" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Around Available
                    </label>
                    <select
                      id="workAroundAvailable"
                      {...register("workAroundAvailable")}
                      onChange={(e) => setShowWorkAroundDescription(e.target.value === "true")}
                      className={`w-full border ${errors.workAroundAvailable ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>

                    {/* If yes, add a description */}
                    {showWorkAroundDescription && (
                      <div>
                        <label htmlFor="workAroundDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Work Around Description
                        </label>
                        <textarea
                          id="workAroundDescription"
                          {...register("workAroundDescription")}
                          rows={4}
                          className={`w-full border ${errors.workAroundDescription ? "border-red-500" : "border-gray-300"
                            } rounded px-3 py-2`}
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Root Cause Identified */}
                  <div>
                    <label htmlFor="rootCauseIdentified" className="block text-sm font-medium text-gray-700 mb-1">
                      Root Cause Identified
                    </label>
                    <select
                      id="rootCauseIdentified"
                      {...register("rootCauseIdentified")}
                      onChange={(e) => setShowRootCauseDescription(e.target.value === "true")}
                      className={`w-full border ${errors.rootCauseIdentified ? "border-red-500" : "border-gray-300"
                        } rounded px-3 py-2`}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                      <option value="stillInvestigating">Still Investigating</option>
                    </select>

                    {/* If yes, add a description */}
                    {showRootCauseDescription && (
                      <div>
                        <label htmlFor="rootCauseDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Root Cause Description
                        </label>
                        <textarea
                          id="rootCauseDescription"
                          {...register("rootCauseDescription")}
                          rows={4}
                          className={`w-full border ${errors.rootCauseDescription ? "border-red-500" : "border-gray-300"
                            } rounded px-3 py-2`}
                        ></textarea>
                      </div>
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
                      className={`w-full border ${errors.status ? "border-red-500" : "border-gray-300"
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
                      className={`w-full border ${errors.priority ? "border-red-500" : "border-gray-300"
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white ${isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
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