"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
export default function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
     const {getToken} = useAuth();

  // 🔼 Upload file to S3
const handleUpload = async () => {
  if (!file) return alert("Please select a file first.");

  try {
    setLoading(true);

    // Step 1: Get presigned upload URL
    const res = await fetch("/api/s3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, fileType: file.type }),
    });

    const data = await res.json();
    if (!data.uploadUrl) throw new Error("Failed to get upload URL");

    // Step 2: Upload file to S3
    const uploadRes = await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) throw new Error("Upload failed");

    // Step 3: Prepare metadata
    const key = file.name; // same as used in presigned URL
  const url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;


    const token = await getToken();
    // Step 4: Save to your backend (protected with Clerk auth)
    await fetch("http://localhost:5000/api/save-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // if using Clerk frontend
      },
      body: JSON.stringify({ filename: file.name, key, url, fileType: file.type }),
    });

    alert("✅ File uploaded and saved to DB!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed. Check console.");
  } finally {
    setLoading(false);
  }
};

  const handleDownload = async () => {
    if (!file) return alert("Please select a file first.");

    try {
      const res = await fetch(`/api/s3?filename=${file.name}`);
      const data = await res.json();
      if (!data.downloadUrl) throw new Error("No download URL returned");
      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to get download link.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        📂 Upload a File
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpload();
        }}
        className="space-y-4"
      >
      
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Show file name */}
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}

      
          {file && file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="mt-3 w-32 h-32 object-cover rounded-lg border"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Get Download Link
          </button>
        </div>
      </form>

      
      {downloadUrl && (
        <div className="mt-4 text-center">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
}
