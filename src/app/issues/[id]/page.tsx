"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Comments from "@/components/comments/Comments";

// Types
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  assignedToId: string | null;
  reportedById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reportedBy: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function IssueDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch issue details
  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      try {
        const response = await fetch(`/api/issues/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issue");
        }
        
        setIssue(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchIssue();
  }, [id]);
  
  // Status badge color
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Priority badge color
  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case "LOW":
        return "bg-gray-100 text-gray-800";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/issues" className="text-blue-600 hover:underline">
          &larr; Back to Issues
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading issue...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      ) : !issue ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <p>Issue not found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold">{issue.title}</h1>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                  {issue.status.replace("_", " ")}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)}`}>
                  {issue.priority}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Reported by:</span>{" "}
                    <span>{issue.reportedBy.name || issue.reportedBy.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned to:</span>{" "}
                    <span>
                      {issue.assignedTo ? (issue.assignedTo.name || issue.assignedTo.email) : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>{" "}
                    <span>{new Date(issue.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last updated:</span>{" "}
                    <span>{new Date(issue.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {issue.description || "No description provided."}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link
                href={`/issues/${issue.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Edit Issue
              </Link>
            </div>
          </div>
          
          {/* Comments Section */}
          <Comments issueId={issue.id} />
        </>
      )}
    </div>
  );
} 