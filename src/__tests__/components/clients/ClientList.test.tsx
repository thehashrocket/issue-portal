import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientList from '@/components/clients/ClientList';
import { act } from 'react-dom/test-utils';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ClientList Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  
  const mockSearchParams = new URLSearchParams();
  
  const mockClients = [
    {
      id: 'client-1',
      name: 'Test Client 1',
      email: 'client1@example.com',
      status: 'ACTIVE',
      manager: {
        id: 'manager-1',
        name: 'Test Manager',
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'client-2',
      name: 'Test Client 2',
      email: 'client2@example.com',
      status: 'INACTIVE',
      manager: null,
      createdAt: new Date().toISOString(),
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'ADMIN',
        },
      },
    });
    
    // Mock successful response with clients
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockClients }),
      headers: {
        get: jest.fn().mockReturnValue('2'),
      },
    });
  });

  it('renders loading state initially', async () => {
    // Don't wait for the loading state to finish
    render(<ClientList />);
    
    // Look for the loading spinner with the class instead of role
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders clients after loading', async () => {
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish and clients to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Client 2')).toBeInTheDocument();
    expect(screen.getByText('client1@example.com')).toBeInTheDocument();
    expect(screen.getByText('client2@example.com')).toBeInTheDocument();
  });

  it('shows add client button for admin users', async () => {
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Add New Client')).toBeInTheDocument();
  });

  it('shows add client button for account managers', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'ACCOUNT_MANAGER',
        },
      },
    });
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Add New Client')).toBeInTheDocument();
  });

  it('hides add client button for regular users', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'USER',
        },
      },
    });
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Add New Client')).not.toBeInTheDocument();
  });

  it('shows edit links for admin users', async () => {
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    const editLinks = screen.getAllByText('Edit');
    expect(editLinks.length).toBe(2);
  });

  it('hides edit links for regular users', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'USER',
        },
      },
    });
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('shows empty state when no clients are found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      headers: {
        get: jest.fn().mockReturnValue('0'),
      },
    });
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('No clients found.')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to fetch clients' }),
    });
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish and error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('fetches clients with correct pagination parameters', async () => {
    mockSearchParams.set('page', '2');
    
    await act(async () => {
      render(<ClientList />);
    });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/clients?page=2&pageSize=10');
    });
  });

  it('displays pagination information correctly', async () => {
    // Mock a response with multiple pages
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockClients }),
      headers: {
        get: (header: string) => {
          switch (header) {
            case 'X-Total-Count':
              return '25';
            case 'X-Page':
              return '2';
            case 'X-Page-Size':
              return '10';
            case 'X-Total-Pages':
              return '3';
            default:
              return null;
          }
        },
      },
    });
    
    // Set the current page in the URL params
    mockSearchParams.set('page', '2');
    
    await act(async () => {
      render(<ClientList />);
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    });
    
    // Check that pagination info is displayed correctly
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    
    // Check that page buttons are rendered
    const pageButtons = screen.getAllByRole('button', { name: /[0-9]+/ });
    expect(pageButtons.length).toBeGreaterThan(0);
    
    // Check that the current page button has the active style
    const page2Button = screen.getByRole('button', { name: '2' });
    expect(page2Button).toHaveClass('bg-blue-50');
  });
}); 