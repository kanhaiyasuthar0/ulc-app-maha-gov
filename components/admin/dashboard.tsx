"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubAdminList } from "@/components/admin/sub-admin-list";
import { JurisdictionList } from "@/components/admin/jurisdiction-list";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, MapPin, UserIcon, ClipboardList } from "lucide-react";
import { AddSubAdminDialog } from "@/components/admin/add-sub-admin-dialog";
import { AddJurisdictionDialog } from "@/components/admin/add-jurisdiction-dialog";
import dynamic from "next/dynamic";

// Dynamically import the flow dashboard to avoid SSR issues
const AdminFlowDashboard = dynamic(() => import("@/app/dashboard/admin/flow"), { ssr: false });

// --- New: Task Modal and Table ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Add types for subAdmins, jurisdictions, documents, and tasks
interface SubAdmin { id?: string; _id?: string; name: string; }
interface Jurisdiction { id?: string; _id?: string; name: string; }
interface Document { id?: string; _id?: string; fileName: string; }
interface Task {
  _id: string;
  title: string;
  assignedTo: string;
  jurisdictionId?: string;
  relatedDocumentId?: string;
  status: string;
  createdAt: string;
}

export function AdminDashboard() {
  const [isSubAdminDialogOpen, setIsSubAdminDialogOpen] = useState(false);
  const [isJurisdictionDialogOpen, setIsJurisdictionDialogOpen] =
    useState(false);
  const [stats, setStats] = useState({
    subAdmins: 0,
    jurisdictions: 0,
    consumers: 0,
  });
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState({ assignedTo: '', status: '', jurisdictionId: '' });
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  // Task form state
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', jurisdictionId: '', relatedDocumentId: '' });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    // In a real app, fetch these stats from your API
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Use placeholder data for demo
        setStats({
          subAdmins: 5,
          jurisdictions: 8,
          consumers: 124,
        });
      }
    };

    fetchStats();
  }, []);

  // Fetch sub-admins, jurisdictions, documents for form
  useEffect(() => {
    fetch("/api/admin/sub-admins").then(r => r.json()).then(setSubAdmins);
    fetch("/api/admin/jurisdictions").then(r => r.json()).then(setJurisdictions);
    fetch("/api/sub-admin/documents").then(r => r.json()).then(setDocuments);
  }, []);

  // Fetch tasks (with filters)
  useEffect(() => {
    const params = new URLSearchParams(taskFilters as any).toString();
    fetch(`/api/admin/tasks?${params}`).then(r => r.json()).then(setTasks);
  }, [taskFilters, isTaskDialogOpen]);

  // --- Task Modal Handlers ---
  const handleTaskFormChange = (field: keyof typeof taskForm, value: string) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleAssignTask = async () => {
    setAssigning(true);
    await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskForm),
    });
    setAssigning(false);
    setIsTaskDialogOpen(false);
    setTaskForm({ title: '', description: '', assignedTo: '', jurisdictionId: '', relatedDocumentId: '' });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* @ts-expect-error */}
            <div className="text-2xl font-bold">{stats.subAdmins.length}</div>
            <p className="text-xs text-muted-foreground">
              Active sub-administrators
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdictions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* @ts-expect-error */}

              {stats.jurisdictions.length}
            </div>
            <p className="text-xs text-muted-foreground">Managed locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumers</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consumers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sub-admins" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="sub-admins">Sub Admins</TabsTrigger>
            <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
            <TabsTrigger value="flow">Flow Chart</TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="mr-2 h-4 w-4" />Tasks
            </TabsTrigger>
          </TabsList>
          <div>
            <TabsContent value="sub-admins" className="mt-0 border-0 p-0">
              <Button onClick={() => setIsSubAdminDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Sub Admin
              </Button>
            </TabsContent>
            <TabsContent value="jurisdictions" className="mt-0 border-0 p-0">
              <Button onClick={() => setIsJurisdictionDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Jurisdiction
              </Button>
            </TabsContent>
            <TabsContent value="tasks" className="mt-0 border-0 p-0">
              <Button onClick={() => setIsTaskDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />Assign Task
              </Button>
            </TabsContent>
          </div>
        </div>
        <TabsContent value="sub-admins" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Sub Administrators</CardTitle>
              <CardDescription>
                Manage sub-admins and their assigned jurisdictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubAdminList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="jurisdictions" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdictions</CardTitle>
              <CardDescription>
                Manage locations and assign sub-admins to them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JurisdictionList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="flow" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdiction & Sub-Admin Flow</CardTitle>
              <CardDescription>
                Visualize the relationships and assign tasks in a flow chart.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminFlowDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="border-none p-0">
          <div className="mb-4 flex gap-2">
            <Select value={taskFilters.assignedTo || ''} onValueChange={v => setTaskFilters(f => ({ ...f, assignedTo: v || '' }))}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Sub-Admin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sub-Admins</SelectItem>
                {subAdmins.map(sa => {
                  const value = sa.id || sa._id;
                  if (!value) return null;
                  return <SelectItem key={value} value={value}>{sa.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select value={taskFilters.status || ''} onValueChange={v => setTaskFilters(f => ({ ...f, status: v || '' }))}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={taskFilters.jurisdictionId || ''} onValueChange={v => setTaskFilters(f => ({ ...f, jurisdictionId: v || '' }))}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Jurisdiction" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {jurisdictions.map(j => {
                  const value = j.id || j._id;
                  if (!value) return null;
                  return <SelectItem key={value} value={value}>{j.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Title</th>
                  <th className="px-2 py-1">Sub-Admin</th>
                  <th className="px-2 py-1">Jurisdiction</th>
                  <th className="px-2 py-1">Document</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4">No tasks found</td></tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task._id}>
                      <td className="px-2 py-1 font-medium">{task.title}</td>
                      <td className="px-2 py-1">{subAdmins.find(sa => (sa.id || sa._id) === task.assignedTo)?.name || task.assignedTo}</td>
                      <td className="px-2 py-1">{jurisdictions.find(j => (j.id || j._id) === task.jurisdictionId)?.name || task.jurisdictionId}</td>
                      <td className="px-2 py-1">{documents.find(d => (d.id || d._id) === task.relatedDocumentId)?.fileName || task.relatedDocumentId}</td>
                      <td className="px-2 py-1">{task.status}</td>
                      <td className="px-2 py-1">{new Date(task.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Assign Task Modal */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Title" value={taskForm.title || ''} onChange={e => handleTaskFormChange('title', e.target.value)} />
                <Textarea placeholder="Description" value={taskForm.description || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTaskFormChange('description', e.target.value)} />
                <Select value={taskForm.assignedTo || ''} onValueChange={v => handleTaskFormChange('assignedTo', v || '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Sub-Admin" /></SelectTrigger>
                  <SelectContent>
                    {subAdmins.map(sa => <SelectItem key={sa.id || sa._id} value={(sa.id || sa._id) || ''}>{sa.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={taskForm.jurisdictionId || ''} onValueChange={v => handleTaskFormChange('jurisdictionId', v || '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Jurisdiction" /></SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map(j => <SelectItem key={j.id || j._id} value={(j.id || j._id) || ''}>{j.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={taskForm.relatedDocumentId || ''} onValueChange={v => handleTaskFormChange('relatedDocumentId', v || '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Document (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {documents.map(d => {
                      const value = d.id || d._id;
                      if (!value) return null;
                      return <SelectItem key={value} value={value}>{d.fileName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleAssignTask} disabled={assigning}>
                  {assigning ? "Assigning..." : "Assign Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <AddSubAdminDialog
        open={isSubAdminDialogOpen}
        onOpenChange={setIsSubAdminDialogOpen}
      />
      <AddJurisdictionDialog
        open={isJurisdictionDialogOpen}
        onOpenChange={setIsJurisdictionDialogOpen}
      />
    </div>
  );
}
