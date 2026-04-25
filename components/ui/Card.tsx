"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Card({
  children,
  className,
  hover = true
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.01 } : undefined}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={cn(
        "panel trust-surface relative overflow-hidden rounded-2xl p-6 shadow-lg",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:border before:border-transparent before:opacity-0 before:transition before:duration-300",
        hover && "panel-hover before:border-cyan-300/20 hover:before:opacity-100",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
