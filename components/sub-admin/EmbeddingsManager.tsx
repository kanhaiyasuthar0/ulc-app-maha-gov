"use client"; // if using Next.js App Router in the `app` directory

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { IPDFEmbedding } from "@/lib/models/PDFEmbedding";

interface IPdfEmbedding {
  _id: string;
  filename: string;
  jurisdictionId: string;
  createdAt: string;
  updatedAt: string;
  // etc, any other fields
}

interface EmbeddingsManagerProps {
  jurisdictionId: string;
}

interface PdfListItem {
  pdfId: string;
  filename: string;
  createdAt?: Date;
  chunkCount: number;
}

const EmbeddingsManager: React.FC<EmbeddingsManagerProps> = ({
  jurisdictionId,
}) => {
  const [embeddings, setEmbeddings] = useState<IPdfEmbedding[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfList, setPdfList] = useState<PdfListItem[]>([]);
  // Fetch the list of PDF embeddings
  const fetchEmbeddings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/pdf-embeddings?jurisdictionId=${jurisdictionId}`,
        {
          next: {
            // tags: ["embeddings"],
            // revalidate: 10,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch embeddings.");
      }
      const data = await response.json();
      setEmbeddings(data.embeddings || []);
      const grouped = groupByPdfId(data.embeddings);
      setPdfList(grouped); // setting pdf
    } catch (error: any) {
      setStatusMessage(error.message || "Error fetching embeddings.");
    } finally {
      setIsLoading(false);
    }
  };

  function groupByPdfId(docs: IPDFEmbedding[]): PdfListItem[] {
    // e.g., group them in a Map keyed by pdfId
    const map = new Map<string, IPDFEmbedding[]>();
    for (const doc of docs) {
      if (!map.has(doc.pdfId)) {
        map.set(doc.pdfId, []);
      }
      map.get(doc.pdfId)?.push(doc);
    }

    // Convert to array, picking one doc’s info as “representative”
    return Array.from(map.entries()).map(([pdfId, chunks]) => {
      return {
        pdfId,
        // Possibly store the first chunk’s filename, createdAt, etc.
        filename: chunks[0]?.filename || "unknown",
        createdAt: chunks[0]?.createdAt,
        chunkCount: chunks.length,
      };
    });
  }

  useEffect(() => {
    fetchEmbeddings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurisdictionId]);

  // Handle delete
  // handleDelete(pdfId: string)
  const handleDelete = async (pdfId: string) => {
    try {
      setIsLoading(true);
      setStatusMessage("");

      const response = await fetch(`/api/pdf-embeddings/${pdfId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error deleting PDF/embeddings.");
      }

      setStatusMessage("PDF (and all chunks) deleted successfully.");
      // Remove from local state
      setPdfList((prev) => prev.filter((item) => item.pdfId !== pdfId));
    } catch (error: any) {
      setStatusMessage(error.message || "Error deleting PDF/embeddings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="
bg-background text-text-secondary
        dark:bg-background-dark dark:text-text-primary
        p-4
      "
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage PDF Embeddings</h1>
        {isLoading && <p>Loading...</p>}
        {statusMessage && (
          <p className="mb-4 font-medium text-center">{statusMessage}</p>
        )}

        {/* Table or card layout for the embeddings */}
        <div className="space-y-4">
          {pdfList.map((pdf) => (
            <div
              key={pdf.pdfId}
              className="bg-white dark:bg-gray-700 shadow p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">Filename: {pdf.filename}</p>
                <p className="text-sm">
                  {pdf.chunkCount} chunk(s). Created:{" "}
                  {pdf.createdAt
                    ? new Date(pdf.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <Button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDelete(pdf.pdfId)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmbeddingsManager;
