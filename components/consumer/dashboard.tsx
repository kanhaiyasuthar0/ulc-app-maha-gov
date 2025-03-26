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
// import PdfUpload from "./pdf-upload";
import PDFChatInterface from "../chat-section";

interface Jurisdiction {
  id: string;
  name: string;
  consumers: number;
}

export function ConsumerDashboard() {
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
      <PDFChatInterface />
    </div>
  );
}
