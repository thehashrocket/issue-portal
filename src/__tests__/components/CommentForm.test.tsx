import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommentForm from "@/components/comments/CommentForm";
import "@testing-library/jest-dom";

// Mock fetch
global.fetch = jest.fn();

describe("CommentForm", () => {
  const mockIssueId = "test-issue-id";
  const mockOnCommentAdded = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "new-comment-id" } }),
    });
  });
  
  it("renders the form correctly", () => {
    render(<CommentForm issueId={mockIssueId} onCommentAdded={mockOnCommentAdded} />);
    
    expect(screen.getByText("Add a Comment")).toBeInTheDocument();
    expect(screen.getByLabelText("Comment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeInTheDocument();
  });
  
  it("shows validation error when submitting empty form", async () => {
    render(<CommentForm issueId={mockIssueId} onCommentAdded={mockOnCommentAdded} />);
    
    // Submit the form without entering any text
    fireEvent.click(screen.getByRole("button", { name: "Add Comment" }));
    
    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText("Comment text is required")).toBeInTheDocument();
    });
    
    // Ensure fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  it("submits the form successfully", async () => {
    render(<CommentForm issueId={mockIssueId} onCommentAdded={mockOnCommentAdded} />);
    
    // Enter comment text
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "This is a test comment" },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Add Comment" }));
    
    // Wait for the form submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/issues/${mockIssueId}/comments`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ text: "This is a test comment" }),
        })
      );
    });
    
    // Check if onCommentAdded callback was called
    expect(mockOnCommentAdded).toHaveBeenCalledTimes(1);
  });
  
  it("handles API error correctly", async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "API error occurred" }),
    });
    
    render(<CommentForm issueId={mockIssueId} onCommentAdded={mockOnCommentAdded} />);
    
    // Enter comment text
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "This is a test comment" },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Add Comment" }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("API error occurred")).toBeInTheDocument();
    });
    
    // Check that onCommentAdded was not called
    expect(mockOnCommentAdded).not.toHaveBeenCalled();
  });
}); 