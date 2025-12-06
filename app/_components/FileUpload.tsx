"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  isUploaded: boolean;
}

export function FileUpload({
  onFileSelect,
  onUpload,
  isUploading,
  isUploaded,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
  };

  return (
    <div className="w-full space-y-4">
      <label htmlFor="file-input" className="block text-sm font-medium">
        Select a PDF file
      </label>
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer border border-input rounded-md bg-background px-3 py-2"
      />
      {selectedFile && (
        <div className="space-y-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || isUploaded}
            className="w-full"
          >
            {isUploading
              ? "Uploading to Vercel..."
              : isUploaded
              ? "File Uploaded ✓"
              : "Upload File"}
          </Button>
        </div>
      )}
    </div>
  );
}

