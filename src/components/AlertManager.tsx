'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import Link from 'next/link';

type Domain = {
  id: string;
  name: string;
  domainExpiration: Date | null;
  domainStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | null;
  clientId: string;
  client: {
    name: string;
  };
};

type Issue = {
  id: string;
  title: string;
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING' | 'NEEDS_REVIEW' | 'FIXED' | 'CLOSED' | 'WONT_FIX';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: Date | null;
  client: {
    name: string;
  };
};

export default function AlertManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch domains that are active and expire within 30 days
        const domainsResponse = await fetch('/api/domains/expiring');
        const domainsData = await domainsResponse.json();
        
        // Fetch issues with due dates within 10 days and relevant statuses
        const issuesResponse = await fetch('/api/issues/due-soon');
        const issuesData = await issuesResponse.json();
        
        if (domainsData.success) {
          setDomains(domainsData.data);
        }
        
        if (issuesData.success) {
          setIssues(issuesData.data);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getDomainAlertColor = (expirationDate: Date) => {
    const daysUntilExpiration = differenceInDays(expirationDate, new Date());
    if (daysUntilExpiration <= 7) return 'bg-red-100 border-red-500 text-red-700';
    if (daysUntilExpiration <= 14) return 'bg-orange-100 border-orange-500 text-orange-700';
    return 'bg-yellow-100 border-yellow-500 text-yellow-700';
  };

  const getIssueAlertColor = (dueDate: Date, priority: Issue['priority']) => {
    const daysUntilDue = differenceInDays(dueDate, new Date());
    if (priority === 'CRITICAL') return 'bg-red-100 border-red-500 text-red-700';
    if (daysUntilDue <= 3) return 'bg-red-100 border-red-500 text-red-700';
    if (daysUntilDue <= 5) return 'bg-orange-100 border-orange-500 text-orange-700';
    return 'bg-yellow-100 border-yellow-500 text-yellow-700';
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (domains.length === 0 && issues.length === 0) {
    return null; // Don't show anything if there are no alerts
  }

  return (
    <div className="sticky top-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-2 space-y-2">
        {domains.map((domain) => (
          domain.domainExpiration && (
            <div
              key={domain.id}
              className={`flex items-center justify-between px-4 py-2 rounded-md border ${getDomainAlertColor(domain.domainExpiration)}`}
            >
              <div>
                <span className="font-medium">Domain Expiring: </span>
                <Link
                  href={`/clients/${domain.clientId}`}
                  className="underline hover:opacity-80"
                >
                  {domain.name}
                </Link>
                <span className="ml-1">
                  ({domain.client.name}) expires in {differenceInDays(domain.domainExpiration, new Date())} days
                </span>
              </div>
            </div>
          )
        ))}
        
        {issues.map((issue) => (
          issue.dueDate && (
            <div
              key={issue.id}
              className={`flex items-center justify-between px-4 py-2 rounded-md border ${getIssueAlertColor(issue.dueDate, issue.priority)}`}
            >
              <div>
                <span className="font-medium">Issue Due: </span>
                <Link
                  href={`/issues/${issue.id}`}
                  className="underline hover:opacity-80"
                >
                  {issue.title}
                </Link>
                <span className="ml-1">
                  ({issue.client.name}) due in {differenceInDays(issue.dueDate, new Date())} days
                </span>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/75">
                {issue.priority}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
} 