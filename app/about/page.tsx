import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export default function OfficeDetailsPage() {
  return (
    <div>
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ULC</h1>
          <div className="space-x-2">
            <Button variant="secondary" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-background text-text-secondary dark:bg-background-dark dark:text-text-primary px-4 py-8">
        {/* Container */}

        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-6 text-center">About Us</h1>

          {/* Office Info Card */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-primary dark:text-primary-dark">
              Collector and Competent Authority (ULC), Brihanmumbai
            </h2>
            <p className="mb-2 font-medium">
              Address:
              <span className="ml-2 font-normal">
                5th floor, Administrative Building, Govt. Colony, Bandra (East)
              </span>
            </p>
          </div>

          {/* Officers Card */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-primary dark:text-primary-dark">
              Officers
            </h2>
            <ul className="space-y-4">
              <li>
                <span className="font-medium">
                  Collector and Competent Authority:
                </span>
                <span className="ml-2">Shri. Rajendra Kshirsagar (IAS)</span>
              </li>
              <li>
                <span className="font-medium">Deputy Collector:</span>
                <span className="ml-2">Shri. Satish Bagal</span>
              </li>
              <li>
                <span className="font-medium">Asst. Town Planner:</span>
                <span className="ml-2">
                  Sushil Thorat (Head For section 20 related queries)
                </span>
              </li>
              <li>
                <span className="font-medium">Naib Tehsildar:</span>
                <span className="ml-2">
                  Madhuri Shinde (Head For section 10 related queries)
                </span>
              </li>
            </ul>
          </div>

          {/* Roles & Actions (Admin / Sub-Admin / Consumer) */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary dark:text-primary-dark">
              User Roles &amp; Functions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">Admin</h3>
                <p className="text-sm">
                  An Admin can manage all user roles, update office details, and
                  handle high-level oversight of docs and chats.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold">Sub-Admin</h3>
                <p className="text-sm">
                  A Sub-Admin can upload docs at the jurisdiction level. They
                  may also have permissions to review and approve documents.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold">Consumer</h3>
                <p className="text-sm">
                  A Consumer can view the available documents and participate in
                  a chat-based interface to ask questions or request
                  clarifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
