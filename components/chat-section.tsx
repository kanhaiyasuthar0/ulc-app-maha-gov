"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
// Fetch jurisdictions hook
import remarkGfm from "remark-gfm";
const useJurisdictions = () => {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const response = await fetch("/api/jurisdictions");
        const data = await response.json();
        setJurisdictions(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch jurisdictions", error);
        setLoading(false);
      }
    };

    fetchJurisdictions();
  }, []);

  return { jurisdictions, loading };
};

const PDFChatInterface = () => {
  const { jurisdictions, loading } = useJurisdictions();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");

  // Local chat state
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedJurisdiction) {
      alert("Please select a jurisdiction first");
      return;
    }

    // Add the user's message to our local messages state
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          jurisdictionId: selectedJurisdiction,
        }),
      });

      if (!res.ok) {
        // If the API returns an error status code, parse and store the error
        const errorData = await res.json();
        setError(errorData.error || "Error sending message");
        setIsLoading(false);
        return;
      }

      // The API should return an array of new assistant messages
      // e.g. [{ id: "...", role: "assistant", content: "..." }]
      const newMessages = await res.json();
      setMessages((prev) => [...prev, ...newMessages]);
      setInput("");
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Error sending message");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div>Loading jurisdictions...</div>;
  }

  return (
    <Card className="w-full max-w-full mx-auto">
      <CardHeader>
        <CardTitle>Jurisdiction Document Chat</CardTitle>
        <div className="mt-2">
          <Select
            value={selectedJurisdiction}
            onValueChange={(value) => setSelectedJurisdiction(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              {jurisdictions.map((jurisdiction: any) => (
                <SelectItem key={jurisdiction._id} value={jurisdiction._id}>
                  {jurisdiction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4">An error occurred: {error}</div>
        )}
        <div className="h-96 overflow-y-auto mb-4 border p-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-2 p-2 rounded ${
                m.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100"
              }`}
            >
              <strong>{m.role === "user" ? "You" : "AI"}: </strong>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
              {/* <ReactMarkdown
                        className="prose leading-normal prose-a:text-blue-600 hover:prose-a:underline"
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {cleanContent(
                          replacePlaceholder(msg?.content, { name: user?.name })
                        )}
                      </ReactMarkdown> */}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the documents"
            disabled={!selectedJurisdiction}
          />
          <Button type="submit" disabled={isLoading || !selectedJurisdiction}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PDFChatInterface;
