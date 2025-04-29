"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Comments from "@/components/comments/Comments";
import { Issue, IssuePriority, IssueStatus } from "@prisma/client";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : !issue ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>Issue not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{issue.title}</CardTitle>
                <CardDescription>
                  Issue #{id} • Created {new Date(issue.createdAt).toLocaleString()}
                </CardDescription>
              </div>
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
                <Badge variant="secondary" className={getPriorityColor(issue.priority)}>
                  {issue.priority}
                </Badge>
              </div>
            </CardHeader>
            
            {statusError && (
              <div className="mx-6 mb-4 bg-red-100 text-red-700 p-3 rounded-lg">
                <p>{statusError}</p>
              </div>
            )}

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Reported by:</span>{" "}
                      <span>{issue.reportedBy.name || issue.reportedBy.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>{" "}
                      <span>
                        {issue.assignedTo ? (issue.assignedTo.name || issue.assignedTo.email) : "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Environment:</span>{" "}
                      <Badge variant="outline">{issue.environment || "Not specified"}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">How Discovered:</span>{" "}
                      <Badge variant="outline">
                        {issue.howDisovered?.replace("_", " ") || "Not specified"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due date:</span>{" "}
                      <span>{issue.dueDate ? new Date(issue.dueDate).toLocaleString() : "No due date"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last updated:</span>{" "}
                      <span>{new Date(issue.updatedAt).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {issue.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information */}
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="details">
                  <AccordionTrigger>Technical Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Expected Result</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {issue.expectedResult || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Actual Result</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {issue.actualResult || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Steps to Reproduce</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {issue.stepsToReproduce || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Impact</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {issue.impact || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Related Logs</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted p-2 rounded-md">
                            {issue.relatedLogs || "No logs provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="root-cause">
                  <AccordionTrigger>Root Cause Analysis</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={issue.rootCauseIdentified ? "default" : "secondary"}>
                          {issue.rootCauseIdentified ? "Root Cause Identified" : "Root Cause Not Identified"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Root Cause Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {issue.rootCauseDescription || "Not yet determined"}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="workaround">
                  <AccordionTrigger>Workaround Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={issue.workAroundAvailable ? "default" : "secondary"}>
                          {issue.workAroundAvailable ? "Workaround Available" : "No Workaround Available"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Workaround Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {issue.workAroundDescription || "No workaround description provided"}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Comments issueId={issue.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 