"use client";
import React, { useEffect, useState } from "react";

interface FeedbackEntry {
  _id: string;
  answerId: string;
  userQuery: string;
  feedback: string;
  createdAt: string;
}

const FeedbackDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch("/api/chat", { method: "GET" });
        if (!res.ok) throw new Error("Failed to fetch feedback");
        const data = await res.json();
        setFeedback(data);
      } catch (e: any) {
        setError(e.message || "Error fetching feedback");
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Feedback on Answers</h1>
      {loading && <div>Loading feedback...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && feedback.length === 0 && <div>No feedback yet.</div>}
      {!loading && feedback.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Answer ID</th>
                <th className="p-2 border">User Query</th>
                <th className="p-2 border">Feedback</th>
                <th className="p-2 border">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((entry) => (
                <tr key={entry._id} className={entry.feedback === 'not_helpful' ? 'bg-red-50' : ''}>
                  <td className="p-2 border font-mono text-xs">{entry.answerId}</td>
                  <td className="p-2 border">{entry.userQuery}</td>
                  <td className="p-2 border font-semibold">
                    {entry.feedback === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}
                  </td>
                  <td className="p-2 border">{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard; 