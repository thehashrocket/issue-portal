import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/auth-utils";

// Types
type Comment = {
  id: string;
  text: string;
  createdById: string;
  issueId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type CommentListProps = {
  issueId: string;
  onCommentDeleted: () => void;
};

export default function CommentList({ issueId, onCommentDeleted }: CommentListProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      try {
        const response = await fetch(`/api/issues/${issueId}/comments`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch comments");
        }
        
        setComments(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
  }, [issueId]);

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete comment");
      }
      
      // Remove the comment from the list
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // Notify parent component
      onCommentDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if user can delete a comment
  const canDeleteComment = (comment: Comment) => {
    if (!session || !session.user) return false;
    return isAdmin(session) || session.user.id === comment.createdById;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
      
      {comments.length === 0 ? (
        <p className="text-gray-500 italic">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {comment.createdBy.image ? (
                    <img 
                      src={comment.createdBy.image} 
                      alt={comment.createdBy.name || comment.createdBy.email || "User"} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {(comment.createdBy.name || comment.createdBy.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {comment.createdBy.name || comment.createdBy.email || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
                
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    aria-label="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="mt-2 whitespace-pre-wrap">
                {comment.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 