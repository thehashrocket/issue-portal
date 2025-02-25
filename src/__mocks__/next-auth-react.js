const nextAuthReact = jest.createMockFromModule('next-auth/react');

// Mock session data
const mockSession = {
  expires: '1',
  user: { 
    id: 'user-1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: 'USER'
  }
};

// Mock useSession hook
nextAuthReact.useSession = jest.fn(() => ({
  data: mockSession,
  status: 'authenticated'
}));

// Mock SessionProvider component
nextAuthReact.SessionProvider = ({ children }) => children;

// Mock signIn function
nextAuthReact.signIn = jest.fn(() => Promise.resolve({ ok: true }));

// Mock signOut function
nextAuthReact.signOut = jest.fn(() => Promise.resolve({ ok: true }));

module.exports = nextAuthReact; 