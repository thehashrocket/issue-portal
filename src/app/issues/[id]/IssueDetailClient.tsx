"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Comments from "@/components/comments/Comments";
import { Issue, IssuePriority, IssueStatus } from "@prisma/client";
import { toast } from "react-toastify";

// Extended Issue type with relations
type ExtendedIssue = Issue & {
  reportedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

interface IssueDetailClientProps {
  id: string;
}

export default function IssueDetailClient({ id }: IssueDetailClientProps) {
  const [issue, setIssue] = useState<ExtendedIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  
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

  // Handle status change
  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    
    setIsUpdatingStatus(true);
    setStatusError(null);
    
    try {
      const response = await fetch(`/api/issues/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }
      
      // Update local state with new issue data
      setIssue(data.data);
    } catch (err) {
      toast.error("Failed to update status");
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      toast.success("Status updated successfully");
      setIsUpdatingStatus(false);
    }
  };
  
  // Status badge color
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      case "NEEDS_REVIEW":
        return "bg-indigo-100 text-indigo-800";
      case "FIXED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "WONT_FIX":
        return "bg-red-100 text-red-800";
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
        <div className="bg-red-100 text-red-700 p-4 rounded-sm">
          <p>{error}</p>
        </div>
      ) : !issue ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-sm">
          <p>Issue not found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold">{issue.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                    disabled={isUpdatingStatus}
                    className={`appearance-none px-3 py-1.5 text-sm rounded-full border ${
                      isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${getStatusColor(issue.status)}`}
                  >
                    {Object.values(IssueStatus).map((status) => (
                      <option key={status} value={status} className="bg-white">
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  {isUpdatingStatus && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"></div>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)}`}>
                  {issue.priority}
                </span>
              </div>
            </div>
            
            {statusError && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-sm">
                <p>{statusError}</p>
              </div>
            )}
            
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
                  <div>
                    <span className="text-gray-500">Due date:</span>{" "}
                    <span>{issue.dueDate ? new Date(issue.dueDate).toLocaleString() : "No due date"}</span>
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
          </div>
          
          {/* Comments Section */}
          <Comments issueId={issue.id} />
        </>
      )}
    </div>
  );
} 