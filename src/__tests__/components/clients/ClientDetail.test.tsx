import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ClientDetail from '@/components/clients/ClientDetail';
import { act } from 'react-dom/test-utils';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ClientDetail Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockClient = {
    id: 'client-1',
    name: 'Test Client',
    email: 'client@example.com',
    phone: '123-456-7890',
    address: '123 Test St, Test City',
    website: 'https://example.com',
    description: 'Test description',
    primaryContact: 'John Doe',
    sla: 'Standard',
    notes: 'Test notes',
    status: 'ACTIVE',
    manager: {
      id: 'manager-1',
      name: 'Test Manager',
      email: 'manager@example.com',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'ADMIN',
        },
      },
    });
    
    // Mock successful response with client
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockClient }),
    });
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders client details after loading', async () => {
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and client details to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Client' })).toBeInTheDocument();
    });
    
    // Check if client details are rendered
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
    
    // Use getAllByText for elements that appear multiple times
    const statusElements = screen.getAllByText('active');
    expect(statusElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText('Test Manager')).toBeInTheDocument();
  });

  it('shows edit button for admin users', async () => {
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and client details to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Client' })).toBeInTheDocument();
    });
    
    expect(screen.getByText('Edit Client')).toBeInTheDocument();
  });

  it('shows edit button for account managers', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'ACCOUNT_MANAGER',
        },
      },
    });
    
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and client details to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Client' })).toBeInTheDocument();
    });
    
    expect(screen.getByText('Edit Client')).toBeInTheDocument();
  });

  it('hides edit button for regular users', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'USER',
        },
      },
    });
    
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and client details to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Client' })).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Edit Client')).not.toBeInTheDocument();
  });

  it('shows not found message when client does not exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });
    
    await act(async () => {
      render(<ClientDetail clientId="non-existent" />);
    });
    
    // Wait for loading to finish and not found message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Client not found')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Back to Clients')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to fetch client details' }),
    });
    
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('fetches client with correct ID', async () => {
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/clients/client-1');
    });
  });

  it('handles null values in client data', async () => {
    const clientWithNulls = {
      ...mockClient,
      email: null,
      phone: null,
      address: null,
      website: null,
      description: null,
      primaryContact: null,
      sla: null,
      notes: null,
      manager: null,
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: clientWithNulls }),
    });
    
    await act(async () => {
      render(<ClientDetail clientId="client-1" />);
    });
    
    // Wait for loading to finish and client details to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Client' })).toBeInTheDocument();
    });
    
    // Use getAllByText for elements that appear multiple times
    const notProvidedElements = screen.getAllByText('Not provided');
    expect(notProvidedElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText('No description')).toBeInTheDocument();
    expect(screen.getByText('No notes')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
}); 