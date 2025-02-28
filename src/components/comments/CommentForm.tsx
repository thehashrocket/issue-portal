import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentCreateSchema } from "@/lib/validation";
import type { CommentCreateInput } from "@/lib/validation";

type CommentFormProps = {
  issueId: string;
  onCommentAdded: () => void;
};

export default function CommentForm({ issueId, onCommentAdded }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentCreateInput>({
    resolver: zodResolver(commentCreateSchema),
    defaultValues: {
      text: "",
    },
  });
  
  const onSubmit = async (data: CommentCreateInput) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to add comment");
      }
      
      // Reset form
      reset();
      
      // Notify parent component
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-sm shadow-sm p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add a Comment</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-sm mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            id="text"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.text ? "border-red-500" : "border-gray-300"
            } focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter your comment here..."
            {...register("text")}
            disabled={isSubmitting}
          />
          {errors.text && (
            <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                Submitting...
              </>
            ) : (
              "Add Comment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 