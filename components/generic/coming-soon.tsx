"use client";

import React from "react";
import { motion } from "framer-motion";
import { HardHat } from "lucide-react"; // or any icon you prefer

export default function ComingSoon() {
  return (
    <div
      className="
        flex min-h-screen flex-col items-center justify-center
        bg-background text-text-secondary
        dark:bg-background-dark dark:text-text-primary
        px-4
      "
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.7,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <HardHat className="h-16 w-16" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="mt-6 text-3xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Feature Under Construction
      </motion.h1>

      {/* Subtext */}
      <motion.p
        className="mt-4 text-center text-lg max-w-md text-gray-600 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        We’re currently working on this feature. You’ll be able to enjoy it very
        soon! Stay tuned.
      </motion.p>
    </div>
  );
}
