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
import { MapPin, Users } from "lucide-react";
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

interface Jurisdiction {
  _id: string;
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
  // State for the currently selected jurisdiction
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState("");

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
      </Tabs>
    </div>
  );
}
