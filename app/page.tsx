"use client"; // Required if you're using Next.js App Router and framer-motion in a page/component

import Link from "next/link";
import { motion } from "framer-motion";
import ConditionalAuthBlock from "@/components/conditional-auth";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark text-text-secondary dark:text-text-primary">
      {/* HERO SECTION */}
      <header className="container mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Welcome to Our{" "}
          <span className="bg-black text-white rounded mx-1 p-1">ULC CHAT</span>
          Platform
        </motion.h1>
        <motion.p
          className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Built for Maharashtra Govt to manage documents by jurisdiction.
          Citizens can chat with PDFs to understand laws in simple language.
        </motion.p>

        {/* <motion.div
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link
            href="/login"
            className="px-6 py-3 bg-primary dark:bg-primary-dark text-white rounded-md font-semibold hover:bg-primary-dark transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-transparent border border-primary dark:border-primary-dark text-primary dark:text-primary-dark rounded-md font-semibold hover:bg-primary hover:text-white hover:dark:bg-primary-dark transition-colors"
          >
            Register
          </Link>
        </motion.div> */}
        <ConditionalAuthBlock />
      </header>

      {/* ROLES SECTION */}
      <main className="flex-1 container mx-auto px-6 pb-16">
        <motion.section
          className="grid gap-8 md:grid-cols-3 mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.2, duration: 0.5 },
            },
          }}
        >
          {/* Admin Card */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h3 className="text-xl font-bold mb-3 text-primary dark:text-primary-dark">
              Admin Role
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              The Admin can manage sub-admins, create jurisdictions, and oversee
              the entire platform from a modern dashboard.
            </p>
          </motion.div>

          {/* Sub-Admin Card */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h3 className="text-xl font-bold mb-3 text-primary dark:text-primary-dark">
              Sub-Admin Role
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              The Sub-Admin can manage assigned jurisdictions, upload PDFs/docs
              to generate embeddings, and use a chat interface.
            </p>
          </motion.div>

          {/* Consumer Card */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h3 className="text-xl font-bold mb-3 text-primary dark:text-primary-dark">
              Consumer Role
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              A user who registers by default becomes a Consumer. They can log
              in to chat or access personalized content and services.
            </p>
          </motion.div>
        </motion.section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-100 dark:bg-gray-700 py-6">
        <div className="container mx-auto text-center text-gray-500 dark:text-gray-300">
          © 2025 ULC CHAT Web App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
