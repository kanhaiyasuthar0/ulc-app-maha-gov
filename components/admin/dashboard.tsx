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
import { PlusCircle, Users, MapPin, UserIcon } from "lucide-react";
import { AddSubAdminDialog } from "@/components/admin/add-sub-admin-dialog";
import { AddJurisdictionDialog } from "@/components/admin/add-jurisdiction-dialog";

export function AdminDashboard() {
  const [isSubAdminDialogOpen, setIsSubAdminDialogOpen] = useState(false);
  const [isJurisdictionDialogOpen, setIsJurisdictionDialogOpen] =
    useState(false);
  const [stats, setStats] = useState({
    subAdmins: 0,
    jurisdictions: 0,
    consumers: 0,
  });

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subAdmins}</div>
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
            <div className="text-2xl font-bold">{stats.jurisdictions}</div>
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
