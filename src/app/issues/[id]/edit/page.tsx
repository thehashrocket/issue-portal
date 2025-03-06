'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { issueAssignmentSchema } from '@/lib/validation';
import { z } from 'zod';
import Link from 'next/link';
import { use } from 'react';
import { format, parseISO } from 'date-fns';

type FormData = z.infer<typeof issueAssignmentSchema>;

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Issue = {
  id: string;
  title: string;
  assignedToId: string | null;
  dueDate: string | null;
};

export default function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(issueAssignmentSchema),
  });

  // Fetch issue data and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch issue data
        const issueResponse = await fetch(`/api/issues/${resolvedParams.id}`);
        if (!issueResponse.ok) {
          throw new Error('Failed to fetch issue');
        }
        const issueData = await issueResponse.json();
        setIssue(issueData.data);

        // Set form default values
        if (issueData.data.assignedToId) {
          setValue('assignedToId', issueData.data.assignedToId);
        }
        if (issueData.data.dueDate) {
          setValue('dueDate', issueData.data.dueDate.split('T')[0]);
        }

        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`/api/issues/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: data.assignedToId,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update issue');
      }

      router.push(`/issues/${resolvedParams.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white p-6 rounded-sm shadow-sm">
            <p className="text-red-600">Issue not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Issue: {issue.title}</h1>
            <Link
              href={`/issues/${resolvedParams.id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Issue
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-sm mb-6">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Assigned To */}
            <div>
              <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="assignedToId"
                {...register('assignedToId')}
                className={`w-full border ${
                  errors.assignedToId ? 'border-red-500' : 'border-gray-300'
                } rounded px-3 py-2`}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              {errors.assignedToId && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedToId.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                {...register('dueDate')}
                className={`w-full border ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                } rounded px-3 py-2`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href={`/issues/${resolvedParams.id}`}
                className="px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 