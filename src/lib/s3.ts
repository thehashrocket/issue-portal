import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

// File type for our upload
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Uploads a file to S3
 * @param file The file to upload
 * @param customKey Optional custom key for the file
 * @returns Object containing the key and URL of the uploaded file
 */
export async function uploadFileToS3(
  file: UploadedFile,
  customKey?: string
): Promise<{ key: string; url: string }> {
  // Generate a unique key for the file
  const key = customKey || `${randomUUID()}-${file.originalname.replace(/\s+/g, '-')}`;

  // Set up the S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  // Upload the file to S3
  await s3Client.send(new PutObjectCommand(params));

  // Generate a URL for the file
  const url = `https://${bucketName}.s3.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Deletes a file from S3
 * @param key The key of the file to delete
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  await s3Client.send(new DeleteObjectCommand(params));
}

/**
 * Generates a pre-signed URL for a file in S3
 * @param key The key of the file
 * @param expiresIn The number of seconds until the URL expires (default: 3600)
 * @returns The pre-signed URL
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new PutObjectCommand(params);
  return getSignedUrl(s3Client, command, { expiresIn });
} 