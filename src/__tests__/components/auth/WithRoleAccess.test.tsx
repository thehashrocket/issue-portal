import { render, screen, waitFor } from '@testing-library/react';
import { WithRoleAccess } from '@/components/auth/withRoleAccess';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';

// Mock the next-auth useSession hook
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock the next/navigation useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('WithRoleAccess', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
  });

  it('renders children when user has the required role', () => {
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

    render(
      <WithRoleAccess allowedRoles={['ADMIN' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </WithRoleAccess>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects when user does not have the required role', async () => {
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

    render(
      <WithRoleAccess allowedRoles={['ADMIN' as Role]} redirectTo="/unauthorized">
        <div data-testid="protected-content">Protected Content</div>
      </WithRoleAccess>
    );

    // The content should be rendered briefly before the redirect
    expect(screen.getByText('You don\'t have permission to access this page.')).toBeInTheDocument();
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('renders fallback content when user does not have the required role and fallback is provided', () => {
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

    render(
      <WithRoleAccess 
        allowedRoles={['ADMIN' as Role]} 
        fallback={<div data-testid="fallback-content">Fallback Content</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </WithRoleAccess>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to sign in when user is not authenticated', () => {
    // Mock the session to return no user (not authenticated)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    } as any);

    render(
      <WithRoleAccess allowedRoles={['ADMIN' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </WithRoleAccess>
    );

    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });

  it('shows loading state while session is loading', () => {
    // Mock the session to be in loading state
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    } as any);

    render(
      <WithRoleAccess allowedRoles={['ADMIN' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </WithRoleAccess>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
}); 