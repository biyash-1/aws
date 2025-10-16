"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface FileItem {
  _id: string;
  filename: string;
  url: string;
  fileType: string;
  createdAt: string;
}

export default function MyUploadsPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const res = await fetch("http://localhost:5000/api/my-files", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("data is data..", data);
        setFiles(data || []);
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [getToken]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading your files...
      </div>
    );

  if (files.length === 0)
    return (
      <div className="text-center mt-10 text-gray-600">
        📂 No uploads yet. Go upload something!
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        My Uploaded Files
      </h1>

      <ul className="divide-y divide-gray-200">
        {files.map((file) => (
          <li
            key={file._id}
            className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-800">{file.filename}</p>
              <p className="text-sm text-gray-500">
                {new Date(file.createdAt).toLocaleString()}
              </p>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View / Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
