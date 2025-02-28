import { useState } from "react";
import { useSession } from "next-auth/react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

type CommentsProps = {
  issueId: string;
};

export default function Comments({ issueId }: CommentsProps) {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refresh comments when a new comment is added or deleted
  const handleCommentChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <div className="mt-8">
      <div className="border-t border-gray-200 pt-6">
        {/* Only show the comment form for authenticated users */}
        {session?.user ? (
          <CommentForm 
            issueId={issueId} 
            onCommentAdded={handleCommentChange} 
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-sm mb-6">
            <p>Please sign in to add comments.</p>
          </div>
        )}
        
        {/* Comment list with key for refreshing */}
        <CommentList 
          key={refreshKey}
          issueId={issueId} 
          onCommentDeleted={handleCommentChange} 
        />
      </div>
    </div>
  );
} 