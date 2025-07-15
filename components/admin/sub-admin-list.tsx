"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { EditSubAdminDialog } from "@/components/admin/edit-sub-admin-dialog";

interface SubAdmin {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  jurisdictions: string[];
  createdAt: string;
}

export function SubAdminList() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, fetch from your API
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch("/api/admin/sub-admins");
        const data = await response.json();
        setSubAdmins(data);
      } catch (error) {
        console.error("Failed to fetch sub-admins:", error);
        // Use placeholder data for demo
        setSubAdmins([
          {
            id: "1",
            name: "Jane Smith",
            email: "jane@example.com",
            jurisdictions: ["Mumbai", "Thane"],
            createdAt: "2023-01-15T10:30:00Z",
          },
          {
            id: "2",
            name: "Raj Patel",
            email: "raj@example.com",
            jurisdictions: ["Pune"],
            createdAt: "2023-02-20T14:45:00Z",
          },
          {
            id: "3",
            name: "Priya Sharma",
            email: "priya@example.com",
            jurisdictions: ["Mumbai"],
            createdAt: "2023-03-10T09:15:00Z",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdmins();
  }, []);

  const handleEdit = (subAdmin: SubAdmin) => {
    setSelectedSubAdmin(subAdmin);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this sub-admin?")) {
      try {
        // In a real app, call your API
        await fetch(`/api/admin/sub-admins/${id}`, { method: "DELETE" });

        // Update local state
        setSubAdmins(subAdmins.filter((admin) => admin.id !== id));
      } catch (error) {
        console.error("Failed to delete sub-admin:", error);
      }
    }
  };

  if (loading) {
    return <div>Loading sub-admins...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Jurisdictions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subAdmins.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No sub-admins found
              </TableCell>
            </TableRow>
          ) : (
            subAdmins.map((subAdmin) => {
              const key = subAdmin.id || subAdmin._id;
              if (!key) return null; // skip if no unique key
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{subAdmin.name}</TableCell>
                  <TableCell>{subAdmin.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subAdmin.jurisdictions.map((jurisdiction) => (
                        <Badge key={jurisdiction} variant="outline">
                          {jurisdiction}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(subAdmin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subAdmin)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <EditSubAdminDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        subAdmin={selectedSubAdmin as any}
      />
    </div>
  );
}
