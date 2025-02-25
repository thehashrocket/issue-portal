# Issue Portal

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Code Quality**: ESLint, Prettier
- **Package Manager**: pnpm
- **File Storage**: AWS S3

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

## AWS S3 Setup for File Uploads

The application uses AWS S3 for storing file uploads. Follow these steps to set up your S3 bucket:

1. Create an AWS account if you don't have one already.
2. Create a new S3 bucket:
   - Go to the AWS Management Console and navigate to S3.
   - Click "Create bucket".
   - Choose a unique bucket name (e.g., `issue-portal-files`).
   - Select the region closest to your users.
   - Configure other settings as needed (default settings are usually fine).
   - Create the bucket.

3. Set up CORS configuration for your bucket:
   - Select your bucket and go to the "Permissions" tab.
   - Scroll down to "Cross-origin resource sharing (CORS)" and click "Edit".
   - Add the following configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
   - For production, replace `"AllowedOrigins": ["*"]` with your specific domain.

4. Create an IAM user for API access:
   - Go to the IAM service in AWS.
   - Create a new user with programmatic access.
   - Attach the `AmazonS3FullAccess` policy (or create a custom policy with more restricted permissions).
   - Save the Access Key ID and Secret Access Key.

5. Update your `.env` file with the AWS credentials:
   ```
   AWS_REGION=your-region
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

For security best practices, consider:
- Using IAM roles instead of access keys for production deployments.
- Creating a custom IAM policy with only the necessary permissions.
- Setting up bucket policies to restrict access.
- Enabling server-side encryption for your S3 bucket.
