import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import NotificationBell from '@/components/NotificationBell';
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
  }
];

describe('NotificationBell Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch for notifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          notifications: mockNotifications
        }
      })
    });
  });

  it('renders the bell icon', async () => {
    render(
      <SessionProvider session={mockSession}>
        <NotificationBell />
      </SessionProvider>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?unreadOnly=true');
    });

    // Check if bell icon is rendered
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    expect(bellButton).toBeInTheDocument();
  });

  it('shows the correct number of unread notifications', async () => {
    render(
      <SessionProvider session={mockSession}>
        <NotificationBell />
      </SessionProvider>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?unreadOnly=true');
    });

    // Check if the badge shows the correct count
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('opens the dropdown when clicked', async () => {
    render(
      <SessionProvider session={mockSession}>
        <NotificationBell />
      </SessionProvider>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?unreadOnly=true');
    });

    // Click the bell icon
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);

    // Check if dropdown is visible
    const dropdownTitle = screen.getByText('Notifications');
    expect(dropdownTitle).toBeInTheDocument();

    // Check if notifications are displayed
    expect(screen.getByText('You have been assigned to issue: Test Issue')).toBeInTheDocument();
    expect(screen.getByText('Test User commented on issue: Another Issue')).toBeInTheDocument();
  });

  it('marks a notification as read when clicked', async () => {
    // Mock successful fetch for marking as read
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/notifications?unreadOnly=true') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              notifications: mockNotifications
            }
          })
        });
      } else if (url.includes('/api/notifications/notification-1/read')) {
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
        <NotificationBell />
      </SessionProvider>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?unreadOnly=true');
    });

    // Click the bell icon to open dropdown
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);

    // Click on a notification
    const notification = screen.getByText('You have been assigned to issue: Test Issue');
    fireEvent.click(notification);

    // Check if the API was called to mark as read
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notification-1/read', {
        method: 'PATCH'
      });
    });
  });
}); 