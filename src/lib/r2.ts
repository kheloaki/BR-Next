import { S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Cloudflare R2 is S3-compatible. Use a custom endpoint:
 * https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 */
export function getR2S3Client(): S3Client {
  const endpoint = requireEnv("R2_ENDPOINT");
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function getR2BucketName(): string {
  return requireEnv("R2_BUCKET_NAME");
}

/** Optional public base (custom domain or r2.dev) without trailing slash */
export function getR2PublicBaseUrl(): string | undefined {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  return base || undefined;
}

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().slice(0, 200);
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "file";
}

export function buildUploadKey(params: {
  userId: string;
  originalFilename: string;
  prefix?: string;
}): string {
  const prefix = (params.prefix ?? "uploads").replace(/^\/+|\/+$/g, "");
  const safe = sanitizeFilename(params.originalFilename);
  const stamp = Date.now();
  return `${prefix}/${params.userId}/${stamp}-${safe}`;
}
