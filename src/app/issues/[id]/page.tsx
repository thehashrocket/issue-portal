"use server";

import { Suspense } from 'react';
import type { Metadata } from 'next';
import IssueDetailClient from './IssueDetailClient';

export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return {
    title: `Issue ${params.id}`,
  };
}

export default async function IssueDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { id } = params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IssueDetailClient id={id} />
    </Suspense>
  );
} 