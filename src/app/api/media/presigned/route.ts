import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  buildUploadKey,
  getR2BucketName,
  getR2PublicBaseUrl,
  getR2S3Client,
} from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

type Body = {
  contentType?: string;
  filename?: string;
  /** Logical folder under bucket, default "uploads" */
  prefix?: string;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentType = body.contentType?.trim() ?? "";
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported or missing contentType", allowed: [...ALLOWED_TYPES] },
      { status: 400 },
    );
  }

  const filename = body.filename?.trim() || "upload";
  const key = buildUploadKey({
    userId,
    originalFilename: filename,
    prefix: body.prefix,
  });

  const client = getR2S3Client();
  const bucket = getR2BucketName();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const expiresIn = 300;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicBase = getR2PublicBaseUrl();
  const publicUrl = publicBase ? `${publicBase}/${key}` : undefined;

  return NextResponse.json({
    uploadUrl,
    key,
    bucket,
    contentType,
    expiresIn,
    ...(publicUrl ? { publicUrl } : {}),
  });
}
