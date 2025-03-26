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
import { EditJurisdictionDialog } from "@/components/admin/edit-jurisdiction-dialog";

interface Jurisdiction {
  id: string;
  name: string;
  subAdmins: string[];
  consumers: number;
  createdAt: string;
}

export function JurisdictionList() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState<Jurisdiction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, fetch from your API
    const fetchJurisdictions = async () => {
      try {
        const response = await fetch("/api/admin/jurisdictions");
        const data = await response.json();
        setJurisdictions(data);
      } catch (error) {
        console.error("Failed to fetch jurisdictions:", error);
        // Use placeholder data for demo
        setJurisdictions([
          {
            id: "1",
            name: "Mumbai",
            subAdmins: ["Jane Smith", "Priya Sharma"],
            consumers: 45,
            createdAt: "2023-01-10T08:30:00Z",
          },
          {
            id: "2",
            name: "Pune",
            subAdmins: ["Raj Patel"],
            consumers: 32,
            createdAt: "2023-01-15T10:45:00Z",
          },
          {
            id: "3",
            name: "Thane",
            subAdmins: ["Jane Smith"],
            consumers: 28,
            createdAt: "2023-02-05T14:20:00Z",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchJurisdictions();
  }, []);

  const handleEdit = (jurisdiction: Jurisdiction) => {
    setSelectedJurisdiction(jurisdiction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this jurisdiction?")) {
      try {
        // In a real app, call your API
        await fetch(`/api/admin/jurisdictions/${id}`, { method: "DELETE" });

        // Update local state
        setJurisdictions(jurisdictions.filter((j) => j.id !== id));
      } catch (error) {
        console.error("Failed to delete jurisdiction:", error);
      }
    }
  };

  if (loading) {
    return <div>Loading jurisdictions...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Sub Admins</TableHead>
            <TableHead>Consumers</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jurisdictions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No jurisdictions found
              </TableCell>
            </TableRow>
          ) : (
            jurisdictions.map((jurisdiction) => (
              <TableRow key={jurisdiction.id}>
                <TableCell className="font-medium">
                  {jurisdiction.name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {jurisdiction.subAdmins.map((admin) => (
                      <Badge key={admin} variant="outline">
                        {admin}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{jurisdiction.consumers}</TableCell>
                <TableCell>
                  {new Date(jurisdiction.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(jurisdiction)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(jurisdiction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditJurisdictionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        jurisdiction={selectedJurisdiction}
      />
    </div>
  );
}
