"use client"; // Needed if using Next.js App Router with client components

import { motion } from "framer-motion";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main
      className="
        min-h-screen flex items-center justify-center
        bg-background dark:bg-background-dark
        text-text-secondary dark:text-text-primary
        px-4
      "
    >
      <motion.div
        className="max-w-lg text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4">401 - Unauthorized</h1>
        <p className="text-lg">
          Sorry, you need to be logged in to access this page. <br />
          Please log in or register for an account below.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="
              px-6 py-3 bg-primary dark:bg-primary-dark
              text-white rounded-md font-semibold
              hover:bg-primary-dark transition-colors
            "
          >
            Login
          </Link>
          <Link
            href="/register"
            className="
              px-6 py-3 bg-transparent border border-primary dark:border-primary-dark
              text-primary dark:text-primary-dark rounded-md font-semibold
              hover:bg-primary hover:text-white hover:dark:bg-primary-dark
              transition-colors
            "
          >
            Register
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
