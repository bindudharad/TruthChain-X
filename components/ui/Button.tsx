"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export function Button({
  children,
  className,
  variant = "primary",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-500 text-white shadow-[0_14px_40px_rgba(56,189,248,0.24)] hover:shadow-[0_18px_46px_rgba(96,165,250,0.34)]",
    secondary:
      "border border-white/10 bg-white/[0.04] text-slate-100 hover:border-cyan-400/30 hover:bg-white/[0.08] hover:shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_12px_28px_rgba(5,10,20,0.24)]",
    ghost: "text-slate-300 hover:bg-white/[0.04] hover:text-white"
  };

  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="inline-flex"
    >
      <button
        disabled={disabled}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_58%)] before:opacity-0 before:transition before:duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:ring-offset-0",
          !disabled && "hover:before:opacity-100",
          disabled && "cursor-not-allowed opacity-55 saturate-75",
          styles[variant],
          className
        )}
        {...props}
      >
        <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="relative z-10">{children}</span>
      </button>
    </motion.div>
  );
}
