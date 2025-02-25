import { render, screen } from '@testing-library/react';
import RoleBasedContent from '@/components/auth/RoleBasedContent';
import { useRoleCheck } from '@/lib/hooks/useRoleCheck';
import { Role } from '@prisma/client';

// Mock the useRoleCheck hook
jest.mock('@/lib/hooks/useRoleCheck');
const mockUseRoleCheck = useRoleCheck as jest.MockedFunction<typeof useRoleCheck>;

describe('RoleBasedContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user has the required role', () => {
    // Mock the hook to return that the user has the required role
    mockUseRoleCheck.mockReturnValue({
      hasRole: true,
      isLoading: false,
      isAdmin: false,
      isAccountManager: false,
      isDeveloper: true,
      isClient: false,
      role: 'DEVELOPER' as Role,
      isAuthenticated: true,
      session: { user: { id: '1', role: 'DEVELOPER' as Role } } as any
    });

    render(
      <RoleBasedContent allowedRoles={['DEVELOPER' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </RoleBasedContent>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when user does not have the required role', () => {
    // Mock the hook to return that the user does not have the required role
    mockUseRoleCheck.mockReturnValue({
      hasRole: false,
      isLoading: false,
      isAdmin: false,
      isAccountManager: false,
      isDeveloper: false,
      isClient: true,
      role: 'CLIENT' as Role,
      isAuthenticated: true,
      session: { user: { id: '1', role: 'CLIENT' as Role } } as any
    });

    render(
      <RoleBasedContent allowedRoles={['ADMIN' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </RoleBasedContent>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders fallback content when user does not have the required role and fallback is provided', () => {
    // Mock the hook to return that the user does not have the required role
    mockUseRoleCheck.mockReturnValue({
      hasRole: false,
      isLoading: false,
      isAdmin: false,
      isAccountManager: false,
      isDeveloper: false,
      isClient: true,
      role: 'CLIENT' as Role,
      isAuthenticated: true,
      session: { user: { id: '1', role: 'CLIENT' as Role } } as any
    });

    render(
      <RoleBasedContent 
        allowedRoles={['ADMIN' as Role]} 
        fallback={<div data-testid="fallback-content">Fallback Content</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </RoleBasedContent>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    // Mock the hook to return that it's still loading
    mockUseRoleCheck.mockReturnValue({
      hasRole: false,
      isLoading: true,
      isAdmin: false,
      isAccountManager: false,
      isDeveloper: false,
      isClient: false,
      role: undefined,
      isAuthenticated: false,
      session: null
    });

    render(
      <RoleBasedContent allowedRoles={['ADMIN' as Role]}>
        <div data-testid="protected-content">Protected Content</div>
      </RoleBasedContent>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
}); 