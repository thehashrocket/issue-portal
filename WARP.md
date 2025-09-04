# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development Server
```bash
pnpm dev                # Start development server on port 3005 with turbopack
pnpm start              # Start production server on port 3006
```

### Build & Production
```bash
pnpm build              # Build for production (includes prisma generate)
```

### Code Quality & Formatting
```bash
pnpm lint               # Run ESLint
pnpm format             # Format code with Prettier
pnpm format:check       # Check if code is properly formatted
```

### Testing
```bash
pnpm test               # Run Jest tests
```

### Database
```bash
./start-database.sh     # Start local PostgreSQL Docker container
pnpm db:seed            # Seed database with sample data
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations in development
npx prisma studio       # Open Prisma Studio for database management
```

### Package Management
```bash
pnpm install            # Install dependencies (preferred package manager)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Styling**: TailwindCSS v4+ with Shadcn UI components
- **File Storage**: AWS S3 for file uploads
- **Notifications**: Real-time notification system with node-cron scheduling
- **Testing**: Jest with React Testing Library
- **Code Quality**: ESLint + Prettier

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── clients/       # Client management endpoints
│   │   ├── issues/        # Issue tracking endpoints
│   │   ├── users/         # User management endpoints
│   │   └── notifications/ # Notification endpoints
│   ├── auth/              # Authentication pages
│   ├── clients/           # Client management pages
│   ├── issues/            # Issue tracking pages
│   ├── users/             # User management pages
│   └── dashboard/         # Dashboard page
├── components/            # Reusable React components
│   ├── ui/               # Shadcn UI components (button, card, etc.)
│   ├── auth/             # Authentication-related components
│   ├── clients/          # Client-specific components
│   ├── issues/           # Issue-specific components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility functions and configurations
│   ├── prisma/          # Prisma client setup
│   ├── hooks/           # Custom React hooks
│   └── auth.ts          # NextAuth configuration
└── types/               # TypeScript type definitions
```

### Data Model
The application centers around five core entities:
- **Users**: Role-based access (USER, ADMIN, ACCOUNT_MANAGER, DEVELOPER)
- **Clients**: Customer management with status tracking and SLA information
- **Issues**: Comprehensive issue tracking with priority, status, and assignment
- **Files**: AWS S3-backed file attachments for issues
- **Notifications**: Real-time notification system for issue updates

### Key Architectural Patterns

#### Authentication & Authorization
- NextAuth.js v5 with Google OAuth provider
- Role-based access control (RBAC) throughout the application
- Custom middleware for API route protection
- Session management with Prisma adapter

#### File Upload System
- AWS S3 integration with presigned URLs for secure uploads
- Multer middleware for handling multipart form data
- File metadata stored in PostgreSQL via Prisma

#### Real-time Features
- Notification system with cron job scheduling
- Comment system for issue collaboration
- Status change tracking and notifications

#### UI Components
- Shadcn UI component library with TailwindCSS v4+
- Server Components by default, Client Components when necessary
- Responsive design with mobile-first approach
- AG Grid for data tables with custom renderers

### Environment Setup Requirements
```bash
# Required environment variables
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
```

## Development Guidelines

### Code Standards
- Follow SOLID principles
- Use TypeScript interfaces over enums (prefer const maps)
- Server Components by default, Client Components only when necessary
- Implement proper loading states and error boundaries
- Mobile-first responsive design with TailwindCSS utilities

### Component Architecture
- Keep components focused and single-responsibility
- Use proper TypeScript typing for all props and data structures
- Implement skeleton loaders for async data
- Follow Shadcn UI patterns for consistent styling

### API Development
- All API routes require authentication via middleware
- Use Zod for request validation
- Implement proper error handling and status codes
- Rate limiting configured for production use

### Database Operations
- Use Prisma for all database operations
- Leverage database indexes for performance
- Use transactions for multi-step operations
- Follow the existing schema patterns for new entities

### Testing Strategy
- Jest configuration with jsdom environment
- Mock NextAuth for testing authenticated components
- Use path mapping (@/) for clean imports
- Test both API routes and UI components

## Important Notes

### Port Configuration
- Development server runs on port 3005
- Production server runs on port 3006
- Local database runs on standard PostgreSQL port 5432

### File Upload Implementation
- Files are stored in AWS S3 with metadata in PostgreSQL
- Presigned URLs used for secure upload/download
- CORS configuration required for S3 bucket

### Notification System
- Automated notifications for issue assignments and status changes
- Cron job for checking due dates and sending reminders
- Real-time updates via polling (consider WebSocket upgrade for production)

### Role-Based Access
- ADMIN: Full system access
- ACCOUNT_MANAGER: Client and issue management
- DEVELOPER: Issue assignment and resolution
- USER: Basic issue reporting and viewing

### Database Container
The `start-database.sh` script manages a local PostgreSQL Docker container with automatic password generation for security.
