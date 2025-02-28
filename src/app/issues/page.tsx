"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IssueStatus, IssuePriority, Issue as PrismaIssue, User } from "@prisma/client";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

// Constants
const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS = Object.values(IssueStatus);
const PRIORITY_OPTIONS = Object.values(IssuePriority);

// Extended Issue type to include user relations
type Issue = PrismaIssue & {
  reportedBy: Pick<User, 'id' | 'name' | 'email'>;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
};

export default function IssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalIssues, setTotalIssues] = useState(0);
  
  // Filters and pagination
  const currentPage = Number(searchParams.get("page") || "1");
  const statusFilter = searchParams.get("status") || "";
  const priorityFilter = searchParams.get("priority") || "";
  const assignedToFilter = searchParams.get("assignedToId") || "";
  
  // Fetch issues
  useEffect(() => {
    async function fetchIssues() {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        if (statusFilter) params.append("status", statusFilter);
        if (priorityFilter) params.append("priority", priorityFilter);
        if (assignedToFilter) params.append("assignedToId", assignedToFilter);
        
        // Add pagination
        params.append("page", currentPage.toString());
        params.append("limit", ITEMS_PER_PAGE.toString());
        
        const response = await fetch(`/api/issues?${params.toString()}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issues");
        }
        
        setIssues(data.data.issues);
        setTotalIssues(data.data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchIssues();
  }, [currentPage, statusFilter, priorityFilter, assignedToFilter]);
  
  // Update filters
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.set("page", "1");
    router.push(`/issues?${params.toString()}`);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalIssues / ITEMS_PER_PAGE);
  
  // Handle page change
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/issues?${params.toString()}`);
  };
  
  // Status badge color
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.NEW:
        return "bg-blue-100 text-blue-800";
      case IssueStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case IssueStatus.CLOSED:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Priority badge color
  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case IssuePriority.LOW:
        return "bg-gray-100 text-gray-800";
      case IssuePriority.MEDIUM:
        return "bg-blue-100 text-blue-800";
      case IssuePriority.HIGH:
        return "bg-orange-100 text-orange-800";
      case IssuePriority.CRITICAL:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Link 
          href="/issues/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm"
        >
          New Issue
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-sm shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => updateFilters("status", e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => updateFilters("priority", e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2"
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={assignedToFilter}
              onChange={(e) => updateFilters("assignedToId", e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2"
            >
              <option value="">All Assignees</option>
              {/* This would need to be populated with users */}
            </select>
          </div>
        </div>
      </div>
      
      {/* Issues List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading issues...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-sm">
          <p>{error}</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white p-8 rounded-sm shadow-sm text-center">
          <p className="text-gray-500">No issues found. Try adjusting your filters or create a new issue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/issues/${issue.id}`} className="text-blue-600 hover:underline">
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {issue.reportedBy.name || issue.reportedBy.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {issue.assignedTo ? (issue.assignedTo.name || issue.assignedTo.email) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={goToPage} 
      />
    </div>
  );
} 