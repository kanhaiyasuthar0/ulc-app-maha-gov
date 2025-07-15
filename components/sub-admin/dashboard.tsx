"use client";

import { useState, useEffect, ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JurisdictionDetails } from "@/components/sub-admin/jurisdiction-details";
import PdfUpload from "./pdf-upload";
import PDFChatInterface from "../chat-section";
import EmbeddingsManager from "./EmbeddingsManager";
import { Label } from "../ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Jurisdiction {
  _id: string;
  name: string;
  consumers: number;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  jurisdictionId?: string;
  relatedDocumentId?: string;
  createdAt: string;
}

export function SubAdminDashboard() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsumers: 0,
    jurisdictionCount: 0,
  });
  // State for the currently selected jurisdiction
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubAdminJurisdictions = async () => {
      try {
        // NEW: Use your new Sub-Admin endpoint
        const response = await fetch("/api/sub-admin/jurisdictions");
        if (!response.ok) {
          throw new Error("Failed to fetch sub-admin jurisdictions");
        }
        const data: Jurisdiction[] = await response.json();

        setJurisdictions(data);

        // Calculate stats
        const totalConsumers = data.reduce(
          (sum, j) => sum + (j.consumers || 0),
          0
        );
        setStats({
          totalConsumers,
          jurisdictionCount: data.length,
        });

        // Default to the first jurisdiction if available
        if (data.length > 0) {
          setSelectedJurisdictionId(data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch sub-admin jurisdictions:", error);
        // Optionally handle errors or show fallback
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdminJurisdictions();
  }, []);

  // Fetch tasks for sub-admin
  useEffect(() => {
    setTasksLoading(true);
    setTasksError(null);
    fetch("/api/sub-admin/tasks")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch tasks");
        return r.json();
      })
      .then(setTasks)
      .catch((err) => setTasksError(err.message))
      .finally(() => setTasksLoading(false));
  }, []);

  // Helper for notification badge
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  // Status update handler
  const handleStatusChange = async (taskId: string, status: string) => {
    setUpdatingTaskId(taskId);
    await fetch("/api/sub-admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status } : t));
    setUpdatingTaskId(null);
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  const handleJurisdictionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedJurisdictionId(e.target.value);
  };

  const selectedJurisdiction = jurisdictions.find(
    (j) => j._id === selectedJurisdictionId
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdictions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jurisdictionCount}</div>
            <p className="text-xs text-muted-foreground">Assigned locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsumers}</div>
            <p className="text-xs text-muted-foreground">
              Total users in your jurisdictions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jurisdiction Dropdown */}

      <Tabs defaultValue="contents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contents">Contents</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardList className="mr-2 h-4 w-4" />My Tasks
            {pendingCount > 0 && (
              <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contents Tab */}
        <TabsContent value="contents" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Contents</CardTitle>
              <CardDescription>
                View contents in your assigned jurisdictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedJurisdiction ? (
                <>
                  {jurisdictions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Select a Jurisdiction
                      </Label>
                      <Select
                        value={selectedJurisdictionId}
                        onValueChange={(value) =>
                          //@ts-expect-error
                          handleJurisdictionChange({ target: { value } })
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map((j) => (
                            <SelectItem key={j._id} value={j._id}>
                              {j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* PDF Upload */}
                  <PdfUpload jurisdictionId={selectedJurisdiction._id} />

                  {/* Embeddings Manager */}
                  <EmbeddingsManager
                    jurisdictionId={selectedJurisdiction._id}
                  />
                </>
              ) : (
                <p>Please select a jurisdiction.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Consumers</CardTitle>
              <CardDescription>
                Interact with users in your jurisdiction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedJurisdiction ? (
                <PDFChatInterface />
              ) : (
                <p>Please select a jurisdiction to start chatting.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you by the admin.</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div>Loading tasks...</div>
              ) : tasksError ? (
                <div className="text-red-600">{tasksError}</div>
              ) : tasks.length === 0 ? (
                <div>No tasks assigned.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 py-1">Title</th>
                        <th className="px-2 py-1">Status</th>
                        <th className="px-2 py-1">Jurisdiction</th>
                        <th className="px-2 py-1">Document</th>
                        <th className="px-2 py-1">Created</th>
                        <th className="px-2 py-1">Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        const jurisdictionName = jurisdictions.find(j => j._id === task.jurisdictionId)?.name || (task.jurisdictionId ? task.jurisdictionId : 'Unknown');
                        // You can fetch document name if needed, for now just show ID or '-'
                        return (
                          <tr key={task._id}>
                            <td className="px-2 py-1 font-medium">{task.title}</td>
                            <td className="px-2 py-1">{task.status}</td>
                            <td className="px-2 py-1">{jurisdictionName}</td>
                            <td className="px-2 py-1">{task.relatedDocumentId || '-'}</td>
                            <td className="px-2 py-1">{new Date(task.createdAt).toLocaleDateString()}</td>
                            <td className="px-2 py-1">
                              <Select value={task.status || "pending"} onValueChange={v => handleStatusChange(task._id, v)} disabled={updatingTaskId === task._id}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
