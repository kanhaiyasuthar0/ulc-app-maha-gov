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
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import dynamic from 'next/dynamic';
import { FaUser, FaRobot } from 'react-icons/fa';


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

const useJurisdictionDocuments = (jurisdictionId: string) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jurisdictionId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/pdf-embeddings?jurisdictionId=${jurisdictionId}`)
      .then((res) => res.json())
      .then((data) => setDocs(data.embeddings || []))
      .catch((err) => setError("Failed to fetch documents."))
      .finally(() => setLoading(false));
  }, [jurisdictionId]);

  return { docs, loading, error };
};

const PDFChatInterface = () => {
  const { jurisdictions, loading } = useJurisdictions();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");
  const { docs: availableDocs, loading: docsLoading, error: docsError } = useJurisdictionDocuments(selectedJurisdiction);

  // Local chat state
  interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: any[];
    context?: string;
    originalQuery?: string;
    translatedQuery?: string;
    detectedLanguage?: string;
    pdfUrls?: string[]; // Added pdfUrls to the interface
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [answerId: string]: boolean }>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('feedbackGiven') || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });
  const [feedbackMsg, setFeedbackMsg] = useState<{ [answerId: string]: string }>({});
  const [feedbackLoading, setFeedbackLoading] = useState<{ [answerId: string]: boolean }>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedbackGiven', JSON.stringify(feedbackGiven));
    }
  }, [feedbackGiven]);

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
    setProcessing(true);

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
        setProcessing(false);
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
      setProcessing(false);
    }
  };

  async function sendFeedback(answerId: string, userQuery: string, feedback: 'helpful' | 'not_helpful') {
    setFeedbackLoading((prev) => ({ ...prev, [answerId]: true }));
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, userQuery, feedback }),
      });
      setFeedbackGiven((prev) => ({ ...prev, [answerId]: true }));
      setFeedbackMsg((prev) => ({ ...prev, [answerId]: 'Thank you for your feedback!' }));
    } catch (e) {
      setFeedbackMsg((prev) => ({ ...prev, [answerId]: 'Error submitting feedback.' }));
    } finally {
      setFeedbackLoading((prev) => ({ ...prev, [answerId]: false }));
    }
  }

  if (loading) {
    return <div>Loading jurisdictions...</div>;
  }

  return (
    <Card className="w-full max-w-full mx-auto">
      <CardHeader>
        <CardTitle>
          <span className="text-2xl font-bold text-[#1a237e]">Ask a Question</span>
        </CardTitle>
        <p className="text-[#374151] mt-2 mb-4 text-base">Citizens can chat with Maharashtra government documents. No login required. Select a jurisdiction and ask your question below.</p>
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
        {/* Document List */}
        <div className="mt-4">
          {docsLoading ? (
            <div>Loading documents...</div>
          ) : docsError ? (
            <div className="text-red-500">{docsError}</div>
          ) : availableDocs.length === 0 && selectedJurisdiction ? (
            <div className="text-yellow-600">No documents available for this jurisdiction. Please ask an official to upload documents.</div>
          ) : (
            <div>
              <div className="font-semibold mb-1">Available Documents:</div>
              <ul className="list-disc ml-6">
                {[...new Set(availableDocs.map((d) => d.filename))].map((filename) => (
                  <li key={filename}>{filename}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4">An error occurred: {error}</div>
        )}
        {(uploading || processing) && (
          <div className="mb-4 text-blue-600 font-semibold flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            Processing your request...
          </div>
        )}
        <div className="h-96 overflow-y-auto mb-4 flex flex-col gap-2 p-2 bg-gray-50 rounded-lg border">
          {messages.map((m, idx) => {
            // Use pdfUrls from backend response for assistant messages
            let pdfUrls: string[] = [];
            if (m.role === "assistant" && m.pdfUrls) {
              pdfUrls = m.pdfUrls;
            }
            // Detect 'no answer found' and show a friendly message
            const isNoAnswer =
              m.role === "assistant" &&
              /no answer found in the documents|i don\'t know/i.test(m.content);
            const isUser = m.role === "user";

            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className={`max-w-[80%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  <div className={`rounded-full bg-white shadow p-2 flex items-center justify-center ${isUser ? 'border-blue-200' : 'border-gray-200'} border`}>
                    {isUser ? <FaUser className="text-blue-500" /> : <FaRobot className="text-gray-500" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 shadow ${isUser ? 'bg-blue-100 text-right' : 'bg-white'} ${isUser ? 'ml-2' : 'mr-2'} w-full`}>
                    <div className="text-sm">
                      <strong>{isUser ? "You" : "AI"}: </strong>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                    {isNoAnswer && (
                      <div className="mt-2 text-yellow-700 font-semibold">
                        No answer found in the documents. Try rephrasing your question or ask an admin to upload more documents.
                      </div>
                    )}
                    {/* Citations and chunk preview */}
                    {pdfUrls.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div className="font-semibold">Source PDF{pdfUrls.length > 1 ? 's' : ''}:</div>
                        <ul>
                          {pdfUrls.map((url, i) => (
                            <li key={i}>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Feedback buttons for assistant answers */}
                    {m.role === "assistant" && !feedbackGiven[m.id] && (
                      <div className="mt-3 flex gap-2 items-center">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <button
                          className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-800 text-xs disabled:opacity-50"
                          onClick={() => sendFeedback(m.id, m.originalQuery || '', 'helpful')}
                          disabled={feedbackLoading[m.id]}
                        >
                          👍 Helpful
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 text-xs disabled:opacity-50"
                          onClick={() => sendFeedback(m.id, m.originalQuery || '', 'not_helpful')}
                          disabled={feedbackLoading[m.id]}
                        >
                          👎 Not Helpful
                        </button>
                        {feedbackLoading[m.id] && <span className="text-xs text-gray-400 ml-2">Submitting...</span>}
                      </div>
                    )}
                    {m.role === "assistant" && feedbackGiven[m.id] && (
                      <div className="mt-3 text-green-600 text-xs flex items-center gap-1">
                        <span>Thank you for your feedback!</span>
                      </div>
                    )}
                    {m.role === "assistant" && feedbackMsg[m.id] && !feedbackGiven[m.id] && (
                      <div className="mt-2 text-green-600 text-xs">{feedbackMsg[m.id]}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the documents"
            disabled={!selectedJurisdiction || availableDocs.length === 0 || uploading || processing}
          />
          <Button type="submit" disabled={isLoading || !selectedJurisdiction || availableDocs.length === 0 || uploading || processing}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PDFChatInterface;
