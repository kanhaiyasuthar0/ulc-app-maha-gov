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
import { JurisdictionDetails } from "@/components/sub-admin/jurisdiction-details";
import { MapPin, Users } from "lucide-react";
// import SubAdminDocumentManager from "./doc-manage";
import PdfUpload from "./pdf-upload";
import PDFChatInterface from "../chat-section";

interface Jurisdiction {
  id: string;
  name: string;
  consumers: number;
}

export function SubAdminDashboard() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsumers: 0,
    jurisdictionCount: 0,
  });

  useEffect(() => {
    // In a real app, fetch from your API
    const fetchJurisdictions = async () => {
      try {
        const response = await fetch("/api/sub-admin/jurisdictions");
        const data = await response.json();
        setJurisdictions(data);

        // Calculate stats
        const totalConsumers = data.reduce(
          (sum: number, j: Jurisdiction) => sum + j.consumers,
          0
        );
        setStats({
          totalConsumers,
          jurisdictionCount: data.length,
        });
      } catch (error) {
        console.error("Failed to fetch jurisdictions:", error);
        // Use placeholder data for demo
        const mockData = [
          { id: "1", name: "Mumbai", consumers: 45 },
          { id: "2", name: "Thane", consumers: 28 },
        ];
        setJurisdictions(mockData);

        const totalConsumers = mockData.reduce(
          (sum, j) => sum + j.consumers,
          0
        );
        setStats({
          totalConsumers,
          jurisdictionCount: mockData.length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJurisdictions();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="contents" className="space-y-4">
        <TabsList>
          {/* <TabsTrigger value="jurisdictions">My Jurisdictions</TabsTrigger> */}
          <TabsTrigger value="contents">Contents</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="jurisdictions" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Jurisdictions</CardTitle>
              <CardDescription>
                View and manage your assigned jurisdictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jurisdictions.length === 0 ? (
                <p>No jurisdictions assigned yet.</p>
              ) : (
                <div className="space-y-6">
                  {jurisdictions.map((jurisdiction) => (
                    <JurisdictionDetails
                      key={jurisdiction.id}
                      jurisdiction={jurisdiction}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contents" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Contents</CardTitle>
              <CardDescription>
                View contents in your jurisdictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <p>Consumer management features will be implemented here.</p> */}
              {/* <SubAdminDocumentManager
                jurisdictionId={"67e3ab68f58b043df5b29bde"}
              /> */}
              <PdfUpload jurisdictionId="67e3ab68f58b043df5b29bde" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chat" className="border-none p-0">
          <Card>
            <CardHeader>
              <CardTitle>Consumers</CardTitle>
              <CardDescription>
                View consumers in your jurisdictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <p>Consumer management features will be implemented here.</p> */}
              {/* <SubAdminDocumentManager
                jurisdictionId={"67e3ab68f58b043df5b29bde"}
              /> */}
              <PDFChatInterface />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
