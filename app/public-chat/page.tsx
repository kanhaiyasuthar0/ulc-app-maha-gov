"use client";

import PDFChatInterface from '@/components/chat-section';
import Image from 'next/image';

export default function PublicChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3f2fd] flex flex-col">
      <header className="bg-white shadow flex items-center px-6 py-4">
        <Image src="/maharashtra-logo.jpg" alt="Maharashtra Logo" width={50} height={50} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold text-[#1a237e]">Ask a Question</h1>
          <p className="text-sm text-[#374151]">Chat with Maharashtra government documents. No login required for citizens.</p>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-3xl">
          <PDFChatInterface />
        </div>
      </main>
      <footer className="bg-white text-[#374151] text-center py-4 border-t mt-auto">
        &copy; {new Date().getFullYear()} Government of Maharashtra. All rights reserved.
      </footer>
    </div>
  );
} 