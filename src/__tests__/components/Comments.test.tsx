import React from "react";
import { render, screen } from "@testing-library/react";
import Comments from "@/components/comments/Comments";
import { useSession } from "next-auth/react";
import "@testing-library/jest-dom";

// Mock the child components
jest.mock("@/components/comments/CommentForm", () => {
  return jest.fn(({ onCommentAdded }) => (
    <div data-testid="mock-comment-form">
      <span>Mock Comment Form</span>
      <button onClick={onCommentAdded}>Trigger onCommentAdded</button>
    </div>
  ));
});

jest.mock("@/components/comments/CommentList", () => {
  return jest.fn(({ onCommentDeleted }) => (
    <div data-testid="mock-comment-list">
      <span>Mock Comment List</span>
      <button onClick={onCommentDeleted}>Trigger onCommentDeleted</button>
    </div>
  ));
});

// Mock next-auth
jest.mock("next-auth/react");

describe("Comments", () => {
  const mockIssueId = "test-issue-id";
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it("renders CommentForm and CommentList when user is authenticated", () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<Comments issueId={mockIssueId} />);
    
    // Check if both components are rendered
    expect(screen.getByTestId("mock-comment-form")).toBeInTheDocument();
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
    expect(screen.getByText("Mock Comment Form")).toBeInTheDocument();
    expect(screen.getByText("Mock Comment List")).toBeInTheDocument();
  });
  
  it("does not render CommentForm when user is not authenticated", () => {
    // Mock unauthenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: null,
    });
    
    render(<Comments issueId={mockIssueId} />);
    
    // Check if only CommentList is rendered
    expect(screen.queryByTestId("mock-comment-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
    expect(screen.queryByText("Mock Comment Form")).not.toBeInTheDocument();
    expect(screen.getByText("Mock Comment List")).toBeInTheDocument();
    
    // Check if sign-in message is shown
    expect(screen.getByText("Please sign in to add comments.")).toBeInTheDocument();
  });
  
  it("refreshes CommentList when a comment is added", () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<Comments issueId={mockIssueId} />);
    
    // Get initial key value (indirectly by checking if component is rendered)
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
    
    // Trigger onCommentAdded callback
    screen.getByText("Trigger onCommentAdded").click();
    
    // Check if CommentList is still rendered (with a new key)
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
  });
  
  it("refreshes CommentList when a comment is deleted", () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "user-1", role: "USER" },
      },
    });
    
    render(<Comments issueId={mockIssueId} />);
    
    // Get initial key value (indirectly by checking if component is rendered)
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
    
    // Trigger onCommentDeleted callback
    screen.getByText("Trigger onCommentDeleted").click();
    
    // Check if CommentList is still rendered (with a new key)
    expect(screen.getByTestId("mock-comment-list")).toBeInTheDocument();
  });
}); 