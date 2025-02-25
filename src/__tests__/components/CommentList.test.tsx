import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommentList from "@/components/comments/CommentList";
import { useSession } from "next-auth/react";
import "@testing-library/jest-dom";

// Mock next-auth
jest.mock("next-auth/react");

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

describe("CommentList", () => {
  const mockIssueId = "test-issue-id";
  const mockOnCommentDeleted = jest.fn();
  
  const mockComments = [
    {
      id: "comment-1",
      text: "This is the first comment",
      createdById: "user-1",
      issueId: mockIssueId,
      createdAt: "2023-01-01T12:00:00Z",
      updatedAt: "2023-01-01T12:00:00Z",
      createdBy: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        image: null,
      },
    },
    {
      id: "comment-2",
      text: "This is the second comment",
      createdById: "user-2",
      issueId: mockIssueId,
      createdAt: "2023-01-02T12:00:00Z",
      updatedAt: "2023-01-02T12:00:00Z",
      createdBy: {
        id: "user-2",
        name: "Another User",
        email: "another@example.com",
        image: "https://example.com/avatar.jpg",
      },
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch to return comments
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockComments }),
    });
    
    // Mock confirm to return true
    (global.confirm as jest.Mock).mockReturnValue(true);
  });
  
  it("renders loading state initially", () => {
    // Mock session as non-admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    expect(screen.getByText("Loading comments...")).toBeInTheDocument();
  });
  
  it("renders comments after loading", async () => {
    // Mock session as non-admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });
    
    // Check if comments are rendered
    expect(screen.getByText("This is the first comment")).toBeInTheDocument();
    expect(screen.getByText("This is the second comment")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Another User")).toBeInTheDocument();
  });
  
  it("shows delete button only for own comments if not admin", async () => {
    // Mock session as non-admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });
    
    // Check delete buttons - should only be one (for user's own comment)
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons).toHaveLength(1);
  });
  
  it("shows delete button for all comments if admin", async () => {
    // Mock session as admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "admin-user", role: "ADMIN" },
      },
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });
    
    // Check delete buttons - should be two (for all comments)
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons).toHaveLength(2);
  });
  
  it("deletes a comment when delete button is clicked", async () => {
    // Mock session as admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "admin-user", role: "ADMIN" },
      },
    });
    
    // Mock fetch for delete request
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      if (options?.method === "DELETE") {
        return {
          ok: true,
          json: async () => ({ message: "Comment deleted" }),
        };
      }
      
      return {
        ok: true,
        json: async () => ({ data: mockComments }),
      };
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("Comments (2)")).toBeInTheDocument();
    });
    
    // Click the first delete button
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);
    
    // Check if confirm was called
    expect(global.confirm).toHaveBeenCalledWith("Are you sure you want to delete this comment?");
    
    // Check if fetch was called with correct URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/comments/comment-1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
    
    // Check if onCommentDeleted callback was called
    expect(mockOnCommentDeleted).toHaveBeenCalledTimes(1);
  });
  
  it("shows 'No comments yet' when there are no comments", async () => {
    // Mock fetch to return empty array
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    
    // Mock session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<CommentList issueId={mockIssueId} onCommentDeleted={mockOnCommentDeleted} />);
    
    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("Comments (0)")).toBeInTheDocument();
    });
    
    // Check if "No comments yet" message is shown
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });
}); 