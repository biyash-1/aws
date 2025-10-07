

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: filename,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutes

    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error("Error generating upload URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Generate presigned URL for download
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: filename,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutes

    return NextResponse.json({ downloadUrl });
  } catch (err) {
    console.error("Error generating download URL:", err);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
