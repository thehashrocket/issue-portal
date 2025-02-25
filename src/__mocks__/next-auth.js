const nextAuth = jest.createMockFromModule('next-auth');

// Mock auth options
nextAuth.getServerSession = jest.fn(() => Promise.resolve({
  expires: '1',
  user: { 
    id: 'user-1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: 'USER'
  }
}));

module.exports = nextAuth; 