import { render, screen, waitFor } from '@testing-library/react';
import RouteGuard from '@/components/auth/RouteGuard';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Role } from '@prisma/client';

// Mock the next-auth useSession hook
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('RouteGuard', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
  });

  it('renders children when user has the required role for the current path', () => {
    // Mock the session to return a user with the required role
    mockUseSession.mockReturnValue({
      data: { 
        user: { 
          id: '1', 
          role: 'ADMIN' as Role 
        } 
      },
      status: 'authenticated',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a protected route that requires ADMIN role
    mockUsePathname.mockReturnValue('/users');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to home when user does not have the required role for the current path', async () => {
    // Mock the session to return a user without the required role
    mockUseSession.mockReturnValue({
      data: { 
        user: { 
          id: '1', 
          role: 'CLIENT' as Role 
        } 
      },
      status: 'authenticated',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a protected route that requires ADMIN role
    mockUsePathname.mockReturnValue('/users');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    // The content should be rendered before the redirect happens
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to sign in when user is not authenticated', async () => {
    // Mock the session to return no user (not authenticated)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a protected route
    mockUsePathname.mockReturnValue('/issues');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('shows loading state while session is loading', () => {
    // Mock the session to be in loading state
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a protected route
    mockUsePathname.mockReturnValue('/issues');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('allows access to non-protected routes for any authenticated user', () => {
    // Mock the session to return a user with CLIENT role
    mockUseSession.mockReturnValue({
      data: { 
        user: { 
          id: '1', 
          role: 'CLIENT' as Role 
        } 
      },
      status: 'authenticated',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a non-protected route
    mockUsePathname.mockReturnValue('/some-public-route');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('checks route access configuration for nested routes', async () => {
    // Mock the session to return a user without the required role
    mockUseSession.mockReturnValue({
      data: { 
        user: { 
          id: '1', 
          role: 'CLIENT' as Role 
        } 
      },
      status: 'authenticated',
      update: jest.fn()
    } as any);
    
    // Mock the pathname to be a nested protected route that requires ADMIN role
    mockUsePathname.mockReturnValue('/users/123');

    render(
      <RouteGuard>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    );

    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
}); 