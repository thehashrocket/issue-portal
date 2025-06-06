'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  type: 'ISSUE_ASSIGNED' | 'COMMENT_ADDED' | 'STATUS_CHANGED' | 'ISSUE_DUE_SOON';
  message: string;
  read: boolean;
  userId: string;
  issueId?: string;
  createdAt: string;
  issue?: {
    id: string;
    title: string;
  };
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch unread notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?unreadOnly=true');
      const data = await response.json();
      
      console.log('Notifications API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      // The API returns { data: { notifications: [...] } }
      if (response.ok && data.data?.notifications) {
        console.log('Setting notifications:', data.data.notifications);
        setNotifications(data.data.notifications);
      } else {
        console.error('Failed to fetch notifications:', data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        // Update local state to mark notification as read
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-1 text-gray-600 hover:text-gray-800 focus:outline-hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden">
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50">
              Notifications
            </div>
            
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.issueId ? `/issues/${notification.issueId}` : '#'}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="text-sm text-gray-900">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50">
              <Link
                href="/notifications"
                className="block px-4 py-3 text-sm text-center text-blue-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 