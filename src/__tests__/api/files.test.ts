import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/files/upload/route';
import { GET } from '@/app/api/files/[issueId]/route';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3';
import { NextRequest, NextResponse } from 'next/server';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock the S3 module
jest.mock('@/lib/s3', () => ({
  uploadFileToS3: jest.fn(),
  deleteFileFromS3: jest.fn(),
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    file: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock FormData
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
  get: jest.fn(),
}));

// Mock NextRequest
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextRequest: jest.fn().mockImplementation(() => ({
      formData: jest.fn(),
    })),
    NextResponse: {
      json: jest.fn(),
    },
  };
});

describe('File API', () => {
  // Mock user session
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    },
  };

  // Mock file data
  const mockFile = {
    buffer: Buffer.from('test file content'),
    originalname: 'test-file.txt',
    mimetype: 'text/plain',
    size: 1024,
  };

  // Mock S3 response
  const mockS3Response = {
    key: 'test-key',
    url: 'https://test-bucket.s3.amazonaws.com/test-key',
  };

  // Mock database record
  const mockFileRecord = {
    id: 'file-123',
    filename: 'test-key',
    originalName: 'test-file.txt',
    mimeType: 'text/plain',
    size: 1024,
    key: 'test-key',
    url: 'https://test-bucket.s3.amazonaws.com/test-key',
    uploadedById: 'user-123',
    issueId: 'issue-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (uploadFileToS3 as jest.Mock).mockResolvedValue(mockS3Response);
    (prisma.file.create as jest.Mock).mockResolvedValue(mockFileRecord);
    (prisma.file.findMany as jest.Mock).mockResolvedValue([mockFileRecord]);
    (NextResponse.json as jest.Mock).mockImplementation((body, options) => ({
      status: options?.status || 200,
      json: async () => body,
    }));
  });

  describe('POST /api/files/upload', () => {
    it('should return 401 if user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost/api/files/upload', {
        method: 'POST',
      });
      
      const response = await POST(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should upload a file successfully', async () => {
      // Mock FormData
      const formData = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'file') return mockFile;
          if (key === 'issueId') return 'issue-123';
          return null;
        }),
      };
      
      const req = new NextRequest('http://localhost/api/files/upload', {
        method: 'POST',
      });
      (req.formData as jest.Mock).mockResolvedValue(formData);
      
      const response = await POST(req);
      expect(response.status).toBe(201);
      
      // Verify that the file was uploaded to S3
      expect(uploadFileToS3).toHaveBeenCalled();
      
      // Verify that the file metadata was saved to the database
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          uploadedById: 'user-123',
          issueId: 'issue-123',
        }),
      });
    });
  });

  describe('GET /api/files/[issueId]', () => {
    it('should return 401 if user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost/api/files/issue-123', {
        method: 'GET',
      });
      
      const response = await GET(req, { params: { issueId: 'issue-123' } });
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return files for an issue', async () => {
      const req = new NextRequest('http://localhost/api/files/issue-123', {
        method: 'GET',
      });
      
      const response = await GET(req, { params: { issueId: 'issue-123' } });
      expect(response.status).toBe(200);
      
      // Verify that the database was queried
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          issueId: 'issue-123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
}); 