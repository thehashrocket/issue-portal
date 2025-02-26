'use client';

import { useState, useEffect } from 'react';
import ClientForm from '@/components/clients/ClientForm';
import { useParams } from 'next/navigation';
import { Client, ClientStatus } from '@prisma/client';

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [initialData, setInitialData] = useState<Partial<Client> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch client details');
        }
        
        const data = await response.json();
        // Ensure status is properly typed as ClientStatus
        setInitialData({
          ...data.data,
          status: data.data.status as ClientStatus
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!loading && !error && initialData && (
        <ClientForm initialData={initialData as Client} clientId={clientId} />
      )}
    </>
  );
} 