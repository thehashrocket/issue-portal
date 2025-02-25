# Issue Portal

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Code Quality**: ESLint, Prettier
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (recommended) or npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd issue-portal
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check code quality
- `pnpm format` - Run Prettier to format code
- `pnpm format:check` - Check if code is properly formatted

## Project Structure

```
issue-portal/
├── src/
│   ├── app/        # Next.js App Router
│   ├── components/ # Reusable components
│   ├── lib/        # Utility functions and libraries
├── public/         # Static assets
├── tailwind.config.ts # TailwindCSS configuration
├── tsconfig.json   # TypeScript configuration
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
