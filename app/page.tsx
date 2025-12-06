"use client";

import { api } from "@/lib/trpc/react";
import { useState, useEffect } from "react";
import { FileUpload } from "./_components/FileUpload";
import { ParseResultsTabs } from "./_components/ParseResultsTabs";
import { ParseMethod, ParseResults } from "./_components/types";

export default function Home() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [parseResults, setParseResults] = useState<ParseResults>({
    pdfParse: null,
    openai: null,
    reducto: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState<Record<ParseMethod, boolean>>({
    openai: false,
    pdfParse: false,
    reducto: false,
  });
  const [activeTab, setActiveTab] = useState<ParseMethod>("pdfParse");
  const [isBlobReady, setIsBlobReady] = useState(false);

  const openaiMutation = api.parse.openai.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setParseResults((prev) => ({
          ...prev,
          openai: data.content || "No content extracted",
        }));
      } else {
        setParseResults((prev) => ({
          ...prev,
          openai: `Error: ${data.error || "Unknown error"}`,
        }));
      }
      setIsParsing((prev) => ({ ...prev, openai: false }));
    },
    onError: (error) => {
      setParseResults((prev) => ({
        ...prev,
        openai: `Error: ${error.message}`,
      }));
      setIsParsing((prev) => ({ ...prev, openai: false }));
    },
  });

  const pdfParseMutation = api.parse.pdfParse.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setParseResults((prev) => ({
          ...prev,
          pdfParse: data.content || "No content extracted",
        }));
      } else {
        setParseResults((prev) => ({
          ...prev,
          pdfParse: `Error: ${data.error || "Unknown error"}`,
        }));
      }
      setIsParsing((prev) => ({ ...prev, pdfParse: false }));
    },
    onError: (error) => {
      setParseResults((prev) => ({
        ...prev,
        pdfParse: `Error: ${error.message}`,
      }));
      setIsParsing((prev) => ({ ...prev, pdfParse: false }));
    },
  });

  const reductoMutation = api.parse.reducto.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setParseResults((prev) => ({
          ...prev,
          reducto: data.content || "No content extracted",
        }));
      } else {
        setParseResults((prev) => ({
          ...prev,
          reducto: `Error: ${data.error || "Unknown error"}`,
        }));
      }
      setIsParsing((prev) => ({ ...prev, reducto: false }));
    },
    onError: (error) => {
      setParseResults((prev) => ({
        ...prev,
        reducto: `Error: ${error.message}`,
      }));
      setIsParsing((prev) => ({ ...prev, reducto: false }));
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setBlobUrl(null);
      setIsBlobReady(false);
      setParseResults({
        openai: null,
        pdfParse: null,
        reducto: null,
      });
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success || !uploadData.blobUrl) {
        const errorMessage = uploadData.error || "Upload failed";
        alert(`Error: ${errorMessage}`);
        setIsUploading(false);
        throw new Error(errorMessage);
      }

      setBlobUrl(uploadData.blobUrl);
      setIsUploading(false);
      setIsBlobReady(false);
      setTimeout(() => {
        setIsBlobReady(true);
      }, 2000);

      return uploadData.blobUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      alert(`Error: ${errorMessage}`);
      setIsUploading(false);
      throw error;
    }
  };

  useEffect(() => {
    if (!blobUrl || !isBlobReady) return;

    const currentResult = parseResults[activeTab];
    const isCurrentlyParsing = isParsing[activeTab];

    if (!currentResult && !isCurrentlyParsing) {
      setIsParsing((prev) => ({ ...prev, [activeTab]: true }));

      switch (activeTab) {
        case "openai":
          openaiMutation.mutate({ blobUrl });
          break;
        case "pdfParse":
          pdfParseMutation.mutate({ blobUrl });
          break;
        case "reducto":
          reductoMutation.mutate({ blobUrl });
          break;
      }
    }
  }, [activeTab, blobUrl, isBlobReady]);

  return (
    <div className="flex min-h-screen flex-col items-center p-8">
      <main className="flex flex-col items-center gap-8 max-w-4xl w-full">
        <FileUpload
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          isUploading={isUploading}
          isUploaded={!!blobUrl}
        />

        {blobUrl && (
          <div className="w-full">
            <ParseResultsTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              parseResults={parseResults}
              isParsing={isParsing}
            />
          </div>
        )}
      </main>
    </div>
  );
}
