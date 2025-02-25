import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import NotificationsPage from '@/app/notifications/page';
import { Role } from '@prisma/client';

// Mock fetch
global.fetch = jest.fn();

// Mock session
const mockSession = {
  expires: '1',
  user: { 
    id: 'user-1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: 'USER' as Role
  }
};

// Mock notifications data
const mockNotifications = [
  {
    id: 'notification-1',
    type: 'ISSUE_ASSIGNED',
    message: 'You have been assigned to issue: Test Issue',
    read: false,
    userId: 'user-1',
    issueId: 'issue-1',
    createdAt: new Date().toISOString(),
    issue: {
      id: 'issue-1',
      title: 'Test Issue'
    }
  },
  {
    id: 'notification-2',
    type: 'COMMENT_ADDED',
    message: 'Test User commented on issue: Another Issue',
    read: false,
    userId: 'user-1',
    issueId: 'issue-2',
    createdAt: new Date().toISOString(),
    issue: {
      id: 'issue-2',
      title: 'Another Issue'
    }
  },
  {
    id: 'notification-3',
    type: 'STATUS_CHANGED',
    message: 'Status changed to IN_PROGRESS for issue: Third Issue',
    read: true,
    userId: 'user-1',
    issueId: 'issue-3',
    createdAt: new Date().toISOString(),
    issue: {
      id: 'issue-3',
      title: 'Third Issue'
    }
  }
];

// Mock useSession hook
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    useSession: jest.fn(() => ({
      data: mockSession,
      status: 'authenticated'
    }))
  };
});

describe('NotificationsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch for notifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          notifications: mockNotifications,
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1
          }
        }
      })
    });
  });

  it('renders the notifications page with correct title', async () => {
    render(
      <SessionProvider session={mockSession}>
        <NotificationsPage />
      </SessionProvider>
    );

    // Check if the page title is rendered
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=10');
    });
  });

  it('displays all notifications correctly', async () => {
    render(
      <SessionProvider session={mockSession}>
        <NotificationsPage />
      </SessionProvider>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=10');
    });

    // Check if all notifications are displayed
    expect(screen.getByText('You have been assigned to issue: Test Issue')).toBeInTheDocument();
    expect(screen.getByText('Test User commented on issue: Another Issue')).toBeInTheDocument();
    expect(screen.getByText('Status changed to IN_PROGRESS for issue: Third Issue')).toBeInTheDocument();
  });

  it('filters unread notifications when unread filter is selected', async () => {
    // Mock fetch for unread notifications
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('unreadOnly=true')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              notifications: mockNotifications.filter(n => !n.read),
              pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1
              }
            }
          })
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              notifications: mockNotifications,
              pagination: {
                page: 1,
                limit: 10,
                total: 3,
                totalPages: 1
              }
            }
          })
        });
      }
    });

    render(
      <SessionProvider session={mockSession}>
        <NotificationsPage />
      </SessionProvider>
    );

    // Wait for initial notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=10');
    });

    // Click the unread filter button
    const unreadButton = screen.getByText('Unread');
    fireEvent.click(unreadButton);

    // Wait for filtered notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=10&unreadOnly=true');
    });
  });

  it('marks a notification as read when clicked', async () => {
    // Mock fetch for marking as read
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/notifications?page=1&limit=10') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              notifications: mockNotifications,
              pagination: {
                page: 1,
                limit: 10,
                total: 3,
                totalPages: 1
              }
            }
          })
        });
      } else if (url.includes('/api/notifications/notification-1/read') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              ...mockNotifications[0],
              read: true
            }
          })
        });
      }
    });

    render(
      <SessionProvider session={mockSession}>
        <NotificationsPage />
      </SessionProvider>
    );

    // Wait for notifications to load and be displayed
    await waitFor(() => {
      expect(screen.getByText('You have been assigned to issue: Test Issue')).toBeInTheDocument();
    });

    // Find and click the "Mark as read" button for the first notification
    const markAsReadButton = screen.getByTestId('mark-read-notification-1');
    fireEvent.click(markAsReadButton);

    // Check if the API was called to mark as read
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notification-1/read', {
        method: 'PATCH'
      });
    });
  });
}); 