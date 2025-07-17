"use client";

import Image from 'next/image';
import { FaUserShield, FaUserTie, FaUserFriends } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleUploadClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
    } else if (session.user?.role === 1) {
      router.push('/dashboard/admin');
    } else if (session.user?.role === 2) {
      router.push('/dashboard/sub-admin');
    } else {
      router.push('/dashboard/consumer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3f2fd] flex flex-col">
      {/* Unified Top Header */}
      <header className="bg-white shadow flex flex-col md:flex-row items-center px-6 py-4 border-b">
        <div className="flex items-center w-full md:w-auto justify-center md:justify-start">
          <Image src="/maharashtra-logo.jpg" alt="Maharashtra Logo" width={60} height={60} className="mr-4" />
          <div className="flex flex-col text-center md:text-left">
            <span className="text-lg font-bold text-[#1a237e] leading-tight">Govt of Maharashtra</span>
            <span className="text-base text-[#374151] leading-tight">Urban development department - ULC</span>
            <span className="text-base font-semibold text-[#1a237e] leading-tight mt-1">Office of the Collector and Competent Authority - ULC (Brihanmumbai)</span>
            <span className="text-sm text-[#374151]">(Shri. Saurabh Kariyar, IAS)</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:items-end items-center mt-4 md:mt-0">
          <h1 className="text-3xl font-extrabold text-[#1a237e] tracking-tight">ULC chatbot</h1>
          <p className="text-base text-[#374151] mt-1">Empowering Citizens with Transparent Access to Public Documents</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 w-full px-4">
        {/* Welcome Section */}
        <section className="w-full max-w-3xl text-center mb-10 mt-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a237e] mb-2">Welcome to the Official <span className="text-4xl text-[#388e3c]">ULC chatbot</span></h2>
          <p className="mb-6 text-[#374151] text-lg">
            Access, upload, and query public government documents with ease. Citizens can ask questions about uploaded documents, and government officials can upload new documents for public access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              onClick={handleUploadClick}
              className="bg-[#ff9800] hover:bg-[#fb8c00] text-white font-semibold py-3 px-6 rounded-lg shadow transition text-lg"
            >
              Upload Document
            </a>
            <a
              href="/public-chat"
              className="bg-[#388e3c] hover:bg-[#2e7d32] text-white font-semibold py-3 px-6 rounded-lg shadow transition text-lg"
            >
              Ask a Question
            </a>
          </div>
          <p className="mt-4 text-[#388e3c] text-base font-medium">No login required for citizens to ask questions!</p>
        </section>

        {/* Roles Section */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Admin Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition">
            <FaUserShield className="text-4xl text-[#1a237e] mb-2" />
            <h3 className="text-lg font-bold text-[#1a237e] mb-1">Admin (IAS Officer)</h3>
            <p className="text-sm text-[#374151] mb-2">Full control over the portal. Can manage sub-admins, oversee all documents, and ensure compliance.</p>
            <div className="flex flex-col items-center mt-2">
              <span className="font-semibold text-[#1a237e]">Shri. Saurabh Kariyar, IAS</span>
              <span className="text-xs text-[#374151]">Collector & Competent Authority, ULC (Brihanmumbai)</span>
            </div>
          </div>
          {/* Sub-Admin Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition">
            <FaUserTie className="text-4xl text-[#1565c0] mb-2" />
            <h3 className="text-lg font-bold text-[#1565c0] mb-1">Sub-Admin</h3>
            <p className="text-sm text-[#374151] mb-2">Manages assigned jurisdictions, uploads documents, and helps keep the portal updated for their region.</p>
            <div className="flex flex-col items-center mt-2">
              <span className="font-semibold text-[#1565c0]">Regional ULC Officer</span>
              <span className="text-xs text-[#374151]">District/City Level</span>
            </div>
          </div>
          {/* Consumer Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition">
            <FaUserFriends className="text-4xl text-[#388e3c] mb-2" />
            <h3 className="text-lg font-bold text-[#388e3c] mb-1">Citizen (Consumer)</h3>
            <p className="text-sm text-[#374151] mb-2">Any citizen can ask questions about public documents, get instant answers, and access government information easily.</p>
            <div className="flex flex-col items-center mt-2">
              <span className="font-semibold text-[#388e3c]">You!</span>
              <span className="text-xs text-[#374151]">Maharashtra Resident</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white text-[#374151] text-center py-4 border-t mt-auto">
        &copy; {new Date().getFullYear()} Government of Maharashtra. All rights reserved.
        <div className="mt-2 text-xs">
          <a href="/privacy" className="underline mr-4">Privacy Policy</a>
          <a href="/rti" className="underline">RTI</a>
        </div>
      </footer>
    </div>
  );
}
