"use client"; // For Next.js App Router, if you want to use state, etc.

import React, { useState } from "react";

interface PdfUploadProps {
  jurisdictionId: string;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ jurisdictionId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage("Please select a PDF file before uploading.");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage("Uploading... Please wait.");
      setDocumentStatus(null);

      const formData = new FormData();
      formData.append("pdfFile", selectedFile);
      formData.append("jurisdictionId", jurisdictionId);
      // Optionally add subAdminId if available

      const response = await fetch("/api/pdf-embeddings", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setStatusMessage(data.message || "Error uploading PDF and embeddings.");
        setDocumentStatus("failed");
        return;
      }
      setStatusMessage(data.message || "PDF uploaded and embeddings created!");
      setDocumentStatus(data.status || null);
    } catch (error: any) {
      setStatusMessage(
        error?.message || "An error occurred while uploading the PDF."
      );
      setDocumentStatus("failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-96 
                    bg-background text-text-secondary dark:bg-background-dark 
                    dark:text-text-primary px-4 py-8"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-700 shadow-md 
                      rounded-md p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Upload PDF</h2>

        <div>
          <label className="block mb-2 font-semibold" htmlFor="pdfFile">
            Select PDF File
          </label>
          <input
            type="file"
            id="pdfFile"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm
                       file:mr-4 file:py-2 file:px-4
                       file:rounded file:border-0
                       file:text-sm file:font-semibold
                       file:bg-primary file:text-white
                       dark:file:bg-primary-dark
                       hover:file:bg-primary-dark
                       cursor-pointer
                       "
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isLoading}
          className="w-full px-4 py-2 font-semibold 
                     bg-primary dark:bg-primary-dark 
                     text-white rounded-md hover:bg-primary-dark 
                     transition-colors 
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Uploading..." : "Upload"}
        </button>

        {statusMessage && (
          <p className="text-center mt-2 font-medium">{statusMessage}</p>
        )}
        {documentStatus && (
          <p className="text-center mt-2 font-semibold">
            Status: {documentStatus === 'ready' ? '✅ Ready' : documentStatus === 'processing' ? '⏳ Processing' : '❌ Failed'}
          </p>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;
