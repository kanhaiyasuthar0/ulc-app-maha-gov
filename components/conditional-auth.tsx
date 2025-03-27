"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
// If you're using NextAuth:
import { useSession } from "next-auth/react";

export default function ConditionalAuthBlock() {
  const { data: session, status } = useSession();

  // You can show a loading state while NextAuth retrieves the session
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // If there's an active session, display "welcome" content
  if (session) {
    return (
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <p className="text-xl font-semibold">
          Welcome, {session.user?.name ?? "User"}!
        </p>
        <Link
          href={
            session.user.role == 1
              ? "/dashboard/admin"
              : session.user.role == 2
              ? "/dashboard/sub-admin"
              : "/dashboard/consumer"
          }
          className="px-6 py-3 bg-primary dark:bg-primary-dark text-white rounded-md font-semibold hover:bg-primary-dark transition-colors"
        >
          Go to Dashboard
        </Link>
      </motion.div>
    );
  }

  // Otherwise, show the Login / Register links
  return (
    <motion.div
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
    </motion.div>
  );
}
