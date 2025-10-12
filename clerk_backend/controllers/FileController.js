import File from "../models/File.js";
import User from "../models/User.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});
console.log(process.env.AWS_ACCESS_KEY_ID);


export const saveFileMetadata = async (req, res) => {


  try {
    const auth = await req.auth();
    const clerkId = auth.userId // requireAuth from Clerk ensures this exists
    const { filename, key, url, fileType } = req.body;

    if (!filename || !key) {
      return res.status(400).json({ message: "Filename and key are required" });
    }


    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const file = await File.create({
      userId: user._id,
      filename,
      key,
      url,
      fileType,
    });

    res.status(201).json({ message: "File metadata saved", file });
  } catch (err) {
    console.error("Error saving file metadata:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMyFiles = async (req, res) => {
 try {
    const clerkId = req.auth.userId;
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const files = await File.find({ userId: user._id }).sort({ uploadedAt: -1 });

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.key,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
        return { ...file._doc, url };
      })
    );

    res.json(filesWithUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};