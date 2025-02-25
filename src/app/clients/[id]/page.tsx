'use client';

import { useParams } from 'next/navigation';
import ClientDetail from '@/components/clients/ClientDetail';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  return <ClientDetail clientId={clientId} />;
} 