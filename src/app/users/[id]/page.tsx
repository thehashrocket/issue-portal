'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@prisma/client'
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserPage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium">Error loading user</h2>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-medium">User not found</h2>
          <p className="text-yellow-600 mt-1">The requested user could not be found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/users">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          {user.image && (
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image
                  src={user.image}
                  alt={`${user.name || 'User'}'s profile picture`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1 text-lg">{user.name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-lg">{user.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <div className="mt-1">
                <Badge variant="secondary" className="text-sm">
                  {user.role.toLowerCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-lg">
                {format(new Date(user.createdAt), 'PPP')}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="mt-1 text-lg">
                {format(new Date(user.updatedAt), 'PPP')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
