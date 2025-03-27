import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Upload, Tag } from "lucide-react";
import axios from "axios";

interface Document {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  metadata: {
    size: number;
    uploadedAt: Date;
    pageCount?: number;
  };
  tags?: string[];
}

export default function SubAdminDocumentManager({
  jurisdictionId,
}: {
  jurisdictionId: string;
}) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string>("");

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await axios.get("/api/sub-admin/documents", {
        params: { jurisdictionId },
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  // Upload document
  const handleDocumentUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("document", uploadFile);
    formData.append("jurisdictionId", jurisdictionId);
    formData.append("tags", tags);

    try {
      await axios.post("/api/sub-admin/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDocuments();
      setUploadFile(null);
      setTags("");
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await axios.delete(`/api/documents?documentId=${documentId}`);
      fetchDocuments();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Update document tags
  const handleUpdateTags = async (documentId: string, newTags: string[]) => {
    try {
      await axios.patch(`/api/documents?documentId=${documentId}`, {
        tags: newTags,
      });
      fetchDocuments();
    } catch (error) {
      console.error("Tag update failed", error);
    }
  };

  useEffect(() => {
    if (session && jurisdictionId) {
      fetchDocuments();
    }
  }, [session, jurisdictionId]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Document Upload Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mb-4">
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <Button onClick={handleDocumentUpload} disabled={!uploadFile}>
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell>{doc.fileType}</TableCell>
                <TableCell>
                  {(doc.metadata.size / 1024).toFixed(2)} KB
                </TableCell>
                <TableCell>
                  {new Date(doc.metadata.uploadedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{doc.tags?.join(", ") || "No tags"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
