"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface JurisdictionDetailsProps {
  jurisdiction: {
    id: string;
    name: string;
    consumers: number;
  };
}

export function JurisdictionDetails({
  jurisdiction,
}: JurisdictionDetailsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {jurisdiction.name}
        </CardTitle>
        <Badge variant="outline" className="ml-2">
          <Users className="mr-1 h-3 w-3" />
          {jurisdiction.consumers} consumers
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>You are assigned as a sub-administrator for this jurisdiction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
